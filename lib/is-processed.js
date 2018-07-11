"use strict";
var github = require('./github');
var BOT_LOGIN = "wpt-pr-bot";

module.exports = function(n) {
    return github.get('/repos/:owner/:repo/issues/:number/comments', { number: n }).then(function(comments) {
        return comments.some(function(comment) {
            return comment.user.login == BOT_LOGIN;
        });
    });
};
