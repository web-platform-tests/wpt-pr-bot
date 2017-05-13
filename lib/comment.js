"use strict";
var github = require('./github');
var q = require('q');
var labelModel = require("./label-model");
var getReviewers = require("./get-reviewers");
var isProcessed = require("./is-processed");
    
function promise(value) {
    var deferred = q.defer();
    deferred.resolve(value);
    return deferred.promise;
}

module.exports = function(number, metadata) {
    if (metadata.reviewedUpstream) {
        // If this has been vetted as already reviewed, then we're good.
        return promise();
    }

    // if there are collaborators, we ask them for a review
    if (metadata.ownersExcludingAuthor.length > 0 || metadata.isRoot) {
        var reviewers = getReviewers(metadata);
        if (reviewers.length > 0) {
            return  github.post('/repos/:owner/:repo/pulls/:number/requested_reviewers', {
                reviewers: reviewers
            }, { number: number }).then(function() {
                metadata.addedReviewers = reviewers;
                if (!metadata.isMergeable) {
                    return labelAndComment(number, "status:needs-collaborator", "No owner on this pull request has write-access to the repository.");
                }
            });
        } else {
            if (!metadata.isMergeable) {
                return labelAndComment(number, "status:needs-collaborator", "No owner on this pull request has write-access to the repository.");
            }
        }
    } else {
        if (metadata.author.isOwner) {
            return labelAndComment(number, "status:needs-owners", "There are no owners for this pull request besides its author.");
        }
        return labelAndComment(number, "status:needs-owners", "There are no owners for this pull request.");
    }
};

function labelAndComment(number, label, msg) {
    msg += " Please reach out on W3C's irc server (irc.w3.org, port 6665) on channel #testing ([web client](http://irc.w3.org/?channels=testing)) to get help with this. Thank you!";
    return labelModel.post(number, [label]).then(function() {
        return isProcessed(number).then(function(processed) {
            if (processed) {
                return github.post('/repos/:owner/:repo/issues/:number/comments', { body: msg }, { number: number });
            }
        })
    });
}
