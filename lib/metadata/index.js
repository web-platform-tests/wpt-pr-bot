"use strict";

var filenames = require('./filenames'),
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

    if (metadata.isWebKitVerified && metadata.webkit.flags.reviewed) {
        return "WebKit";
    }
    return null;
}

module.exports = function getMetadada(number, author, title, content) {
    var metadata = {
        issue: number,
        title: title,
        rootReviewers: ["jgraham"]
    };
    author = author.toLowerCase();
    var reviewers;
    var fileLabels;

    return filenames(number)
        .then(function(filenames) {
            metadata.filenames = filenames.all;
            metadata.filenamesIgnoreRemoved = filenames.ignoreRemoved;
            metadata.paths = paths(metadata.filenames);
            fileLabels = labels.fromFiles(metadata.filenames);
            metadata.isRoot = metadata.filenames.some(function(path) {
                return path.split('/').length == 1;
            });
            return findSpecs(fileLabels);
        }).then(function(specs) {
            metadata.specs = specs;
            metadata.workingGroups = wg(specs);
            metadata.labels = labels.merge(
                fileLabels, labels.fromWorkingGroups(metadata.workingGroups)
            );
        }).then(function() {
            return findOwners(metadata.paths);
        }).then(function(owners) {
            reviewers = owners;
            return findRemovedReviewers(number);
        }).then(function(removedReviewers) {
            reviewers = reviewers.filter(function(reviewer) {
                return removedReviewers.indexOf(reviewer) == -1;
            });
            return status(reviewers);
        }).then(function(reviewers) {
            metadata.owners = reviewers.filter(function(reviewer) {
                return reviewer.permission != "none";
            });
        }).then(function() {
            return status(author);
        }).then(function(permission) {
            metadata.author = {
                login: author,
                permission: permission
            };
        }).then(function() {
            metadata.reviewersExcludingAuthor = metadata.owners.filter(function(owner) {
                return owner.login != metadata.author.login;
            });

            metadata.author.isOwner = metadata.owners.some(function(owner) {
                return owner.login == metadata.author.login;
            });
        }).then(function() {
            return github.get('/repos/:owner/:repo/pulls/:number/requested_reviewers', { number: number }).then(function(requestedReviewers) {
                var reviewers = requestedReviewers.users.map(function(r) { return r.login.toLowerCase(); });
                return github.get('/repos/:owner/:repo/pulls/:number/reviews', { number: number }).then(function(reviews) {
                    metadata.reviews = reviews;

                    reviews.forEach(function(r) {
                        if (r.user && r.user.login) {
                            var login = r.user.login.toLowerCase();
                            if (reviewers.indexOf(login) < 0) {
                                reviewers.push(login);
                            }
                        }
                    });
                    reviewers.sort();
                    metadata.reviewers = reviewers;
                });
            });
        }).then(function() {
            if (webkit.related(metadata.title)) {
                var titleWebkitIssueMatch = metadata.title.match(/.*https:\/\/bugs.webkit.org\/show_bug.cgi\?id=(\d+).*/i);
                if (titleWebkitIssueMatch.length == 2) {
                    var webkitIssue = titleWebkitIssueMatch[1];
                    return webkit.verified(webkitIssue, metadata.issue).then(function (isVerified) {
                        metadata.webkit = {};
                        metadata.webkit.issue = webkitIssue;
                        return isVerified;
                    });
                }
            }
            return false;
        }).then(function(isWebKitVerified) {
            metadata.isWebKitVerified = isWebKitVerified;
            if (isWebKitVerified) {
                metadata.labels.push("webkit-export");
                return webkit.flags(metadata.webkit.issue).then(function (flags) {
                    metadata.webkit.flags = flags;
                    return flags;
                });
            }
        }).then(function() {
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

            return chooseAssignee(number, metadata).then(function(a) {
                metadata.missingAssignee = a;
                return metadata;
            });
        });
};
