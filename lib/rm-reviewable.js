"use strict";
var github = require('./github');
var q = require('q');

module.exports = function(number, metadata) {
    if (_isReviewable(metadata.filenames)) {
        var deferred = q.defer();
        deferred.resolve({
            keepReviewable: true,
            modified: false
        });
        return deferred.promise;
    }

    return github.get('/repos/:owner/:repo/issues/:number', { number: number }).then(function(issue) {
        var body = issue.body.replace(
            /<!-- Reviewable:start -->(.|\n|\r)*?<!-- Reviewable:end -->/,
            "<!-- Reviewable:start -->\n\n<!-- Reviewable:end -->"
        );
        if (body != issue.body) {
            return github.post('/repos/:owner/:repo/issues/:number', { body: body }, { number: number }).then(function() {
                return {
                    previousBody: issue.body,
                    body: body,
                    keepReviewable: false,
                    modified: true
                }
            });
        }
        var deferred = q.defer();
        deferred.resolve({
            body: body,
            keepReviewable: false,
            modified: false
        });
        return deferred.promise;
    });
};

function _isReviewable(filenames) {
    return filenames.some(function(path) {
        var dir = path.split('/')[0];
        return dir == "tools" || dir == "resources";
    });
}
