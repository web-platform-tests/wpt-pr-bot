"use strict";

const getFilenames = require('./filenames'),
      paths = require('./paths'),
      findSpecs = require('./find-specs'),
      findOwners = require('./find-owners'),
      findRemovedReviewers = require('./find-removed-reviewers'),
      wg = require('./wg'),
      status = require('./status'),
      labels = require('./labels'),
      getReviewers = require('./get-reviewers'),
      chooseAssignee = require('./choose-assignee'),
      webkit = require('./webkit'),
      github = require('../github');

function inferDownstreamReview(metadata, content) {
    var login = metadata.author.login;

    if (login == "chromium-wpt-export-bot") {
        return "Chromium";
    }

    if (login == "servo-wpt-sync") {
        return "Servo";
    }

    if (login == "moz-wptsync-bot" ||
        (login == "jgraham" && content.indexOf("MozReview-Commit-ID") > -1) ||
        (login == "dbaron" && content.indexOf("Sync Mozilla CSS tests") > -1)) {
        return "Firefox";
    }

    // WebKit-exported PRs are only considered approved once they have a r+ on
    // the WebKit side. Note that we treat approval as a one-way process; if we
    // see r+ once, the PR will stay approved even if the r+ is later removed.
    //
    // https://hackmd.io/b4ViVtDsSk6Qg8fAycexVA#2-Getting-review-r-on-the-WebKit-patch-approves-the-export-PR
    if (metadata.isWebKitVerified && metadata.webkit.flags.reviewed) {
        return "WebKit";
    }
    return null;
}

module.exports = async function getMetadata(number, author, title, content) {
    var metadata = {
        issue: number,
        title: title,
        rootReviewers: ["jgraham"]
    };
    author = author.toLowerCase();

    const filenames = await getFilenames(number);
    metadata.filenames = filenames.all;
    metadata.filenamesIgnoreRemoved = filenames.ignoreRemoved;
    metadata.paths = paths(metadata.filenames);
    const fileLabels = labels.fromFiles(metadata.filenames);
    metadata.isRoot = metadata.filenames.some(function(path) {
        return path.split('/').length == 1;
    });

    const specs = await findSpecs(fileLabels);
    metadata.specs = specs;
    metadata.workingGroups = wg(specs);
    metadata.labels = labels.merge(
        fileLabels, labels.fromWorkingGroups(metadata.workingGroups)
    );

    let reviewers = await findOwners(metadata.paths);

    const removedReviewers = await findRemovedReviewers(number);
    reviewers = reviewers.filter(function(reviewer) {
        return removedReviewers.indexOf(reviewer) == -1;
    });

    reviewers = await status(reviewers);

    metadata.owners = reviewers.filter(function(reviewer) {
        return reviewer.permission != "none";
    });

    const permission = await status(author);
    metadata.author = {
        login: author,
        permission: permission
    };

    metadata.reviewersExcludingAuthor = metadata.owners.filter(function(owner) {
        return owner.login != metadata.author.login;
    });

    metadata.author.isOwner = metadata.owners.some(function(owner) {
        return owner.login == metadata.author.login;
    });

    // Find any previous reviews on the PR, and form a set of existing
    // reviewers; the latter is used to avoid getting stuck when adding new
    // reviewers to the PR.
    const requestedReviewers = await github.get('/repos/:owner/:repo/pulls/:number/requested_reviewers', { number: number });
    var existingReviewers = requestedReviewers.users.map(function(r) { return r.login.toLowerCase(); });
    const reviews = await github.get('/repos/:owner/:repo/pulls/:number/reviews', { number: number });
    metadata.reviews = reviews;

    reviews.forEach(function(r) {
        if (r.user && r.user.login) {
            var login = r.user.login.toLowerCase();
            if (existingReviewers.indexOf(login) < 0) {
                existingReviewers.push(login);
            }
        }
    });
    existingReviewers.sort();
    metadata.reviewers = existingReviewers;

    metadata.isWebKitVerified = false;
    if (webkit.related(metadata.title)) {
        var titleWebkitIssueMatch = metadata.title.match(/.*http(?:s?):\/\/bugs.webkit.org\/show_bug.cgi\?id=(\d+).*/i);
        if (!titleWebkitIssueMatch || titleWebkitIssueMatch.length != 2) {
            // The chance of anyone using the phrase 'WebKit export of' in
            // their pull request without it being a WebKit export is low
            // enough that we just throw here, to make sure we notice errors.
            throw new Error(`Unable to extract WebKit bug id from PR title: ${metadata.title}`);
        }

        if (titleWebkitIssueMatch.length == 2) {
            var webkitIssue = titleWebkitIssueMatch[1];
            metadata.webkit = {};
            metadata.webkit.issue = webkitIssue;
            metadata.isWebKitVerified = await webkit.verified(webkitIssue, metadata.issue);

            if (metadata.isWebKitVerified) {
                metadata.labels.push("webkit-export");
                metadata.webkit.flags = await webkit.flags(metadata.webkit.issue);
            }
        }
    }

    metadata.isMergeable =
        metadata.isRoot || // That only works because rootReviewers are hard-coded and we know them.
        metadata.author.permission == "admin" ||
        metadata.author.permission == "write" ||
        metadata.owners.some(function(owner) {
            return owner.permission == "admin" || owner.permission == "write";
        });
    // The above is missing the case where a reviewer which has write permission and is not an owner was added.

    metadata.reviewedDownstream = inferDownstreamReview(metadata, content);
    metadata.missingReviewers = getReviewers(metadata);
    metadata.missingAssignee = await chooseAssignee(number, metadata);

    return metadata;
};
