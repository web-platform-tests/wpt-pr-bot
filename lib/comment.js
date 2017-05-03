"use strict";
var github = require('./github');
var q = require('q');

module.exports = function(number, metadata) {
    var owners = metadata.owners.filter(function(owner) {
        return owner != metadata.author;
    });
    if (number == 2507) {
        owners = ["@wpt-pr-bot", "@gsnedders"]
        if (owners.length) {
            return getReviewers(number, owners, false).then(function(results) {
                if (results.reviewers.length) {
                    return results;
                } else {
                    return github.post('/repos/:owner/:repo/pulls/:number/requested_reviewers', {
                        reviewers: owners.map(function(o) { return o.substring(1); })
                    }, { number: number }).then(function() {
                        return getReviewers(number, owners, true);
                    }, function() {
                        return getReviewers(number, owners, true);
                    });
                }
            });
        } else {
            var deferred = q.defer();
            deferred.resolve({
                number: number,
                modified: false,
                owners: null
            });
            return deferred.promise;
        }
    }
    if (owners.length) {
        var body = "Notifying " + join(owners) + ". *([Learn how reviewing works](https://github.com/w3c/web-platform-tests/blob/master/README.md#test-review).)*";
        return github.post('/repos/:owner/:repo/issues/:number/comments', { body: body }, { number: number });
    }

    var deferred = q.defer();
    deferred.resolve();
    return deferred.promise;
};

function getReviewers(number, owners, modified) {
    return github.get('/repos/:owner/:repo/pulls/:number/requested_reviewers', { number: number }).then(function(reviewers) {
        return {
            number: number,
            modified: modified,
            reviewers: reviewers.map(function(r) { return r.login }),
            owners: owners
        };
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
