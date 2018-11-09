'use strict';
var github = require('./github');

module.exports = function(number, reason) {
    return github.get('/repos/:owner/:repo/pulls/:number/reviews', { number: number })
        .then(function(reviews) {
            var isReviewed = reviews.some(function(r) {
                return r.user.login == 'wpt-pr-bot';
            });

            if (isReviewed) {
                return false;
            }

            return github.post('/repos/:owner/:repo/pulls/:number/reviews', {
                    body: reason,
                    event: 'APPROVE',
                    comments: []
                }, { number: number })
                .then(function() {
                    return true;
                });
        });
};
