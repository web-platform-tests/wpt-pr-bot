"use strict";
var github = require('./github');
var q = require('q');
var funk = require("./funk");
var labelModel = require("./label-model");

var NO_COLAB = "None of the owners of this pull request are repo collaborators. Please reach out on W3C's irc server (irc.w3.org, port 6665) on channel #testing ([web client](http://irc.w3.org/?channels=testing)) to get someone to merge this or get added as a collaborator. Thank you!";
    
var NO_OWNERS = "There are no owners for this pull request. Please reach out on W3C's irc server (irc.w3.org, port 6665) on channel #testing ([web client](http://irc.w3.org/?channels=testing)) to get help with this. Thank you!";
    
function promise(value) {
    var deferred = q.defer();
    deferred.resolve(value);
    return deferred.promise;
}

module.exports = function(number, metadata) {
    if (metadata.reviewers.length || metadata.reviewedUpstream) { // If there are reviewers we abord early. They know best.
        return promise();
    } else {
        // if there are collaborators, we ask them for a review
        if (metadata.collaborators.length > 0) {
            return requestReview(number, metadata.collaborators).then(function() {
                // And we ping the non-collaborators in a comment.
                if (metadata.nonCollaborators.length > 0) {
                    var msg = msgToNonCollaborators(metadata);
                    return comment(number, msg);
                }
                return;
            });
        } else if (metadata.nonCollaborators.length > 0) {
            // We've no collaborators but some owners.
            var msg = NO_COLAB + "\n\n" + msgToNonCollaborators(metadata);
            return labelModel.post(number, ["status:needs-collaborator"]).then(function() {
                return comment(number, msg);
            });
        } else if (!metadata.authorIsCollaborator) {
            // we assume that collaborators know what they're doing.
            return labelModel.post(number, ["status:needs-owners"]).then(function() {
                return comment(number, NO_OWNERS);
            });
        }
    }
};

function comment(number, body) {
    return github.post('/repos/:owner/:repo/issues/:number/comments', { body: body }, { number: number });
}

function requestReview(number, collaborators) {
    return github.post('/repos/:owner/:repo/pulls/:number/requested_reviewers', {
        reviewers: collaborators
    }, { number: number })
}

function msgToNonCollaborators(metadata) {
    var handles = metadata.nonCollaborators.map(function(nonCollab) { return "@" + nonCollab; });
    return "Notifying owners who are not repo collaborators: " + join(handles) + ".";
}

module.exports.join = join;
function join(owners) {
	if (owners.length == 0) {
		return "";
	}
	if (owners.length == 1) {
		return owners[0];
	}
	if (owners.length == 2) {
		return owners[0] + " and " + owners[1];
	}
	var last = owners.pop();
	return owners.join(", ") + ", and " + last;
}
