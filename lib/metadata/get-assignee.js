"use strict";
var github = require('./lib/github');

module.exports = function getAssignee(number, metadata) {
    return github.get('/repos/:owner/:repo/issues/:number', { number: number }).then(function(issue) {
      if (issue.assignee) {
        return;
      }
      var reviewers = metadata.reviewersExcludingAuthor.map(function (owner) {
        return owner.login
      });
      if (!reviewers.length) {
        return;
      }
      return reviewers[number % reviewers.length];
    });
}
