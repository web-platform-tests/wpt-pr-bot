"use strict";
var github = require('./github');
var q = require('q');

function promise(value) {
    var deferred = q.defer();
    deferred.resolve(value);
    return deferred.promise;
}

module.exports = function(number, metadata) {
    if (metadata.isReviewable) {
        return promise({
            keepReviewable: true,
            modified: false
        });
    }

    return github.get('/repos/:owner/:repo/issues/:number', { number: number }).then(function(issue) {
        var body = issue.body.replace(
            /<!-- Reviewable:start -->(.|\n|\r)*?<!-- Reviewable:end -->/,
            "<!-- Reviewable:start -->\n\n<!-- Reviewable:end -->"
        );
        if (body != issue.body) {
            return github.post('/repos/:owner/:repo/issues/:number', {
                body: body,
                maintainer_can_modify: issue.maintainer_can_modify
            }, { number: number }).then(function() {
                return {
                    previousBody: issue.body,
                    body: body,
                    keepReviewable: false,
                    modified: true
                };
            });
        }
        return {
            body: body,
            keepReviewable: false,
            modified: false
        };
    });
};
