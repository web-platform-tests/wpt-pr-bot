"use strict";
var github = require('../github');

module.exports = function getAssignee(number, metadata) {
    return github.get('/repos/:owner/:repo/issues/:number', { number: number }).then(function(issue) {
      if (issue.assignee) {
        return null;
      }
      var reviewers = metadata.reviewersExcludingAuthor.map(function (owner) {
        return owner.login
      });
      if (!reviewers.length) {
        return null;
      }
      return reviewers[number % reviewers.length];
    });
}
