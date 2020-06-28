// istanbul ignore file

"use strict";

var github = require('./github');
var BOT_LOGIN = "wpt-pr-bot";

module.exports = async n => {
    const comments = await github.get('/repos/:owner/:repo/issues/:number/comments', { number: n });
    return comments.some(comment => comment.user.login == BOT_LOGIN);
};
