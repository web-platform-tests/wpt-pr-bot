"use strict";
var github = require('../github');

async function findRemovedReviewers(number) {
    const response = await github.get("/repos/:owner/:repo/issues/:number/events", {number: number});
    // istanbul ignore if
    if (!response) {
        throw new Error("Empty response received from GitHub API");
    }
    return response
        .filter(event => event.event == "review_request_removed")
        .map(event => event.requested_reviewer.login);
}

module.exports = findRemovedReviewers;
