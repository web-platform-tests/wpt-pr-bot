"use strict";
var github = require('./github');
var q = require('q');
var approve = require('./approve');
var labelModel = require("./label-model");
var isProcessed = require("./is-processed");

function promise(value) {
    var deferred = q.defer();
    deferred.resolve(value);
    return deferred.promise;
}

var cssEditors = ['fantasai', 'frivoal', 'tabatkins'];

function isExpeditedCss(metadata) {
    return cssEditors.includes(metadata.author.login) &&
        metadata.filenames.every(function(filename) {
            return /^css\//.test(filename);
        });
}

module.exports = function(number, metadata, dryRun) {
    // Auto-approve PR that have been reviewed downstream.
    if (metadata.reviewedDownstream) {
        const message = 'The review process for this patch is being conducted in the ' +
            metadata.reviewedDownstream + ' project.';
        if (dryRun) {
            console.log(`[DRY-RUN] Would approve PR ${number} with message: ${message}`);
            return Promise.resolve(true);
        }

        return approve(number, message);
    }

    if (isExpeditedCss(metadata)) {
        const message = '[Peer review is not required for CSS editors.]' +
            '(https://www.w3.org/2018/10/22-css-minutes.html#item20)';
        if (dryRun) {
            console.log(`[DRY-RUN] Would approve PR ${number} with message: ${message}`);
            return Promise.resolve(true);
        }

        return approve(number, message);
    }

    return promise().then(function() {
        if (metadata.missingAssignee) {
            if (dryRun) {
                console.log(`[DRY-RUN] Would add assignee ${metadata.missingAssignee} to PR ${number}`);
                return Promise.resolve(true);
            }

            return github.patch('/repos/:owner/:repo/issues/:number', {
                assignees: [metadata.missingAssignee]
            }, { number: number });
        }
    }).then(function() {
        // if there are collaborators, we ask them for a review
        if (metadata.reviewersExcludingAuthor.length > 0 || metadata.isRoot) {
            if (metadata.missingReviewers.length > 0) {
                if (dryRun) {
                    console.log(`[DRY-RUN] Would add reviewers ${metadata.missingReviewers} to PR ${number}`);
                    // Assume that adding reviewers would have succeeded.
                    if (!metadata.isMergeable) {
                        console.log(`[DRY-RUN] Would add label "status:needs-collaborator" and comment "No reviewer on this pull request has write-access to the repository." to issue ${number}`);
                    }
                    return Promise.resolve(true);
                }

                return  github.post('/repos/:owner/:repo/pulls/:number/requested_reviewers', {
                    reviewers: metadata.missingReviewers
                }, { number: number }).then(function() {
                    if (!metadata.isMergeable) {
                        return labelAndComment(number, "status:needs-collaborator", "No reviewer on this pull request has write-access to the repository.");
                    }
                });
            } else if (metadata.isMergeable) {
                return promise();
            } else {
                if (dryRun) {
                    console.log(`[DRY-RUN] Would add label "status:needs-collaborator" and comment "No reviewer on this pull request has write-access to the repository." to issue ${number}`);
                    return Promise.resolve(true);
                }
                return labelAndComment(number, "status:needs-collaborator", "No reviewer on this pull request has write-access to the repository.");
            }
        } else {
            if (metadata.author.isOwner) {
                if (dryRun) {
                    console.log(`[DRY-RUN] Would add label "status:needs-reviewers" and comment "There are no reviewers for this pull request besides its author." to issue ${number}`);
                    return Promise.resolve(true);
                }
                return labelAndComment(number, "status:needs-reviewers", "There are no reviewers for this pull request besides its author.");
            }
            if (dryRun) {
                console.log(`[DRY-RUN] Would add label "status:needs-reviewers" and comment "There are no reviewers for this pull request." to issue ${number}`);
                return Promise.resolve(true);
            }
            return labelAndComment(number, "status:needs-reviewers", "There are no reviewers for this pull request.");
        }
    });
};

function labelAndComment(number, label, msg) {
    msg += " Please reach out on W3C's irc server (irc.w3.org, port 6665) on channel #testing ([web client](http://irc.w3.org/?channels=testing)) to get help with this. Thank you!";
    return labelModel.post(number, [label], /*dryRun*/ false).then(function() {
        return isProcessed(number).then(function(processed) {
            if (!processed) {
                return github.post('/repos/:owner/:repo/issues/:number/comments', { body: msg }, { number: number });
            }
        });
    });
}
