// istanbul ignore file

"use strict";

var github = require('../github');

module.exports = async function chooseAssignee(number, metadata) {
  const issue = await github.get('/repos/:owner/:repo/issues/:number', { number: number });
  if (issue.assignee) {
    return null;
  }

  // Check for existing reviews and grab the reviewer who "touched it last".
  var reviews = metadata.reviews;
  if (reviews && reviews.length) {
    return reviews[reviews.length - 1].user.login;
  }

  var reviewers = metadata.reviewersExcludingAuthor;
  if (reviewers.length) {
    var index = Math.floor(Math.random() * reviewers.length);
    return reviewers[index].login;
  }

  return null;
};
