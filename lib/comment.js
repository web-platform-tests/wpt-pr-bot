"use strict";
var github = require('./github');
var q = require('q');
var labelModel = require("./label-model");
    
function promise(value) {
    var deferred = q.defer();
    deferred.resolve(value);
    return deferred.promise;
}

module.exports = function(number, metadata) {
    if (metadata.reviewers.length || metadata.reviewedUpstream) {
        // If there are reviewers we abord early. They know best.
        return promise();
    }

    // if there are collaborators, we ask them for a review
    if (metadata.ownersExcludingAuthor.length > 0 || metadata.isRoot) {
        var reviewers = metadata.ownersExcludingAuthor.map(function(owner) { return owner.login });
        if (metadata.isRoot) { reviewers.push.apply(reviewers, metadata.rootReviewers); };
        return  github.post('/repos/:owner/:repo/pulls/:number/requested_reviewers', {
            reviewers: reviewers
        }, { number: number }).then(function() {
            if (!metadata.isMergeable) {
                return labelAndComment(number, "status:needs-collaborator", "No owner on this pull request has write-access to the repository.");
            }
        });
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
        return github.post('/repos/:owner/:repo/issues/:number/comments', { body: msg }, { number: number });
    });
}