'use strict';
var github = require('./github');

/**
 * Approves a given WPT pull request, if not already approved by wpt-pr-bot.
 */
module.exports = async function(number, reason) {
    const reviews = await github.get('/repos/:owner/:repo/pulls/:number/reviews', { number: number });

    const isReviewed = reviews.some(r => r.user.login == 'wpt-pr-bot');
    if (isReviewed) {
        return false;
    }

    const body = {
        body: reason,
        event: 'APPROVE',
        comments: []
    };
    await github.post('/repos/:owner/:repo/pulls/:number/reviews', body, { number: number });
    return true;
};
