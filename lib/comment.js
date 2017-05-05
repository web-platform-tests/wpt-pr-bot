"use strict";
var github = require('./github');
var q = require('q');
var funk = require("./funk");
var labelModel = require("./label-model");

module.exports = function(number, metadata) {
    var owners = metadata.owners.filter(function(owner) {
        return owner != metadata.author;
    });
    
    if (owners.length) {
        return getReviewers(number, owners, false).then(function(results) {
            if (results.reviewers.length) {
                return results;
            } else {
                return github.post('/repos/:owner/:repo/pulls/:number/requested_reviewers', {
                    reviewers: owners.map(function(o) { return o.substring(1); })
                }, { number: number }).then(handler(number, owners), handler(number, owners));
            }
        });
    }
    
    var deferred = q.defer();
    deferred.resolve({
        number: number,
        modified: false,
        owners: null
    });
    return deferred.promise;
};

function handler(number, owners) {
    return function() {
        return getReviewers(number, owners, true).then(function(results) {
            return accountForOwnersWithoutCommmitRights(results).then(function(results) {
                if (!results.reviewers.length) {
                    return labelModel.post(results.number, ["status:needs-collaborator"]).then(function() { return results; });
                } else {
                    return results;
                }
            });
        });
    }
}

function getReviewers(number, owners, modified) {
    return github.get('/repos/:owner/:repo/pulls/:number/requested_reviewers', { number: number }).then(function(reviewers) {
        return {
            number: number,
            modified: modified,
            reviewers: reviewers.map(function(r) { return r.login }).sort(),
            owners: owners
        };
    });     
}

function accountForOwnersWithoutCommmitRights(results) {
    return github.get("/repos/:owner/:repo/collaborators").then(function(collaborators) {
        collaborators = collaborators.map(funk.prop("login"));
        var leftovers = results.owners.filter(function(o) {
            return collaborators.indexOf(o.substring(1)) < 0;
        });
        
        if (leftovers.length) {
            var body = "Notifying owners who are not repo collaborators: " + join(leftovers) + ".";
            return github.post('/repos/:owner/:repo/issues/:number/comments', { body: body }, { number: results.number })
                .then(function() { return results; }, function() { return results; });
        } else {
            return results;
        }
    });
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
