"use strict";
var github = require('./github');
var q = require('q');
var labelModel = require("./label-model");
var isProcessed = require("./is-processed");

function promise(value) {
    var deferred = q.defer();
    deferred.resolve(value);
    return deferred.promise;
}

module.exports = function(number, metadata) {
    if (metadata.reviewedDownstream) {
        // Auto-approve PR that have been reviewed downstream.
        return github.get('/repos/:owner/:repo/pulls/:number/reviews', { number: number }).then(function(requests) {
            var isReviewed = requests.some(function(r) {
                return r.user.login == "wpt-pr-bot";
            });

            if (!isReviewed) {
                return github.post('/repos/:owner/:repo/pulls/:number/reviews', {
                    body: "Already reviewed downstream.",
                    event: "APPROVE",
                    comments: []
                }, { number: number });
            }
        });
    }

    promise().then(function() {
        if (metadata.missingAssignee) {
            return github.post('/repos/:owner/:repo/pulls/:number', {
                assignee: metadata.missingAssignee
            }, { number: number });
        }
    }).then(function() {
        // if there are collaborators, we ask them for a review
        if (metadata.reviewersExcludingAuthor.length > 0 || metadata.isRoot) {
            if (metadata.missingReviewers.length > 0) {
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
                return labelAndComment(number, "status:needs-collaborator", "No reviewer on this pull request has write-access to the repository.");
            }
        } else {
            if (metadata.author.isOwner) {
                return labelAndComment(number, "status:needs-reviewers", "There are no reviewers for this pull request besides its author.");
            }
            return labelAndComment(number, "status:needs-reviewers", "There are no reviewers for this pull request.");
        }
    });
};

function labelAndComment(number, label, msg) {
    msg += " Please reach out on W3C's irc server (irc.w3.org, port 6665) on channel #testing ([web client](http://irc.w3.org/?channels=testing)) to get help with this. Thank you!";
    return labelModel.post(number, [label]).then(function() {
        return isProcessed(number).then(function(processed) {
            if (!processed) {
                return github.post('/repos/:owner/:repo/issues/:number/comments', { body: msg }, { number: number });
            }
        })
    });
}
