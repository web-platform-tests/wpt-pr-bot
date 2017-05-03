"use strict";
var github = require('./github');
var q = require('q');

module.exports = function(number, metadata) {
    if (_isTools(metadata.filenames)) {
        var deferred = q.defer();
        deferred.resolve();
        return deferred.promise;
    }

    return github.get('/repos/:owner/:repo/issues/:number', { number: number }).then(function(issue) {
        var body = issue.body.replace(
            /<!-- Reviewable:start -->(.|\n)*?<!-- Reviewable:end -->/,
            "<!-- Reviewable:start -->\n\n<!-- Reviewable:end -->"
        );
        if (body != issue.body) {
            return github.post('/repos/:owner/:repo/issues/:number', { body: body }, { number: number });
        }
        var deferred = q.defer();
        deferred.resolve();
        return deferred.promise;
    });
};

function _isTools(filenames) {
    return filenames.some(function(path) {
        return path.split('/')[0] == "tools"
    });
}
