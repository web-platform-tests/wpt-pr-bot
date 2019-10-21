"use strict";

// Filter functions for GitHub API responses. Returns true if the entity passes
// the filter, like a `Array.prototype.filter` callback. The `log` callback is
// called with any console messages that should be logged.

function filterEvent(body, log) {
    if (!body) {
        log("Ignoring event: no body");
        return false;
    }
    if (body.sender && body.sender.login == "wpt-pr-bot") {
        log("Ignoring event: sender is wpt-pr-bot");
        return false;
    }
    return true;
}

function filterPullRequest(pull_request, log) {
    if (pull_request.state == "closed") {
        log(`Ignoring #${pull_request.number}: pull request is closed`);
        return false;
    }
    if (pull_request.draft) {
        log(`Ignoring #${pull_request.number}: pull request is a draft`);
        return false;
    }
    return true;
}

exports.event = filterEvent;
exports.pullRequest = filterPullRequest;
