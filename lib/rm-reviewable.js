"use strict";
var github = require('./github');
var q = require('q');

module.exports = function(number, metadata) {
    if (metadata.labels.indexOf("infra") > -1) {
        var deferred = q.defer();
        deferred.resolve();
        return deferred.promise;
    }

    return github.get('/repos/:owner/:repo/issues/:number', { number: number }).then(function(issue) {
        var body = issue.body.replace(
            /<!-- Reviewable:start -->(.|\n)*?<!-- Reviewable:end -->/,
            "<!-- Reviewable:start -->\n\n<!-- Reviewable:end -->"
        );
        return github.post('/repos/:owner/:repo/issues/:number', { body: body }, { number: number });
    });
};
