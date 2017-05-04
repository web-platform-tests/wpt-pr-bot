"use strict";
var github = require('./github');
var q = require('q');

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
                }, { number: number }).then(function() {
                    return getReviewers(number, owners, true);
                }, function() {
                    return getReviewers(number, owners, true);
                });
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

