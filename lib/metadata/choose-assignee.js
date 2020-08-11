// istanbul ignore file

"use strict";

const github = require('../github'),
      logger = require('../logger');

module.exports = async function chooseAssignee(number, metadata) {
  const issue = await github.get('/repos/:owner/:repo/issues/:number', { number: number });
  if (issue.assignee) {
    return null;
  }

  // Check for existing reviews and grab the reviewer who "touched it last".
  var reviews = metadata.reviews;
  if (reviews && reviews.length) {
    logger.info(`#${number}: Set missing assignee to latest reviewer ` +
        reviews[reviews.length - 1].user.login);
    return reviews[reviews.length - 1].user.login;
  }

  var reviewers = metadata.reviewersExcludingAuthor;
  if (reviewers.length) {
    logger.info(`#${number}: Randomly choosing assignee from reviewersExcludingAuthor`);
    var index = Math.floor(Math.random() * reviewers.length);
    return reviewers[index].login;
  }

  logger.info(`#${number}: reviewersExcludingAuthor was empty, will not set missing assignee.`);
  return null;
};
