"use strict";
var github = require('../github');

function findRemovedReviewers(number) {
    return github.get("/repos/:owner/:repo/issues/:number/events", {number: number})
        .then(function(response) {
            if (!response /* TODO or something */) {
                throw new Error("Something's up!")
            }
            //var array = JSON.parse(response);
            var reviewers = response.filter(function(event) {
                return event.event === "review_request_removed";
            }).map(function(event) {
                return event.requested_reviewer.login;
            });
            return reviewers;
        });
}

module.exports = findRemovedReviewers;
