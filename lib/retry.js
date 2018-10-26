'use strict';

var q = require('q');

/**
 * Create a function that retries an asynchronous operation
 *
 * @param {object} descriptor
 * @param {number} descriptor.maxAttempts - the maximum number of times to
 *                                          retry the operation
 * @param {function} descriptor.action - the asynchronous action to perform;
 *                                       this function must return a Promise
 *                                       instance
 * @param {function} descriptor.when - a function which determines whether the
 *                                     operation should be retried; it is
 *                                     invoked with the operation's result if
 *                                     `maxAttempts` has not been reached; if
 *                                     this function returns `true`, the
 *                                     operation will be retried
 */
module.exports = function(descriptor) {
    var attemptsRemaining = descriptor.maxAttempts;
    var action = descriptor.action;
    var when = descriptor.when;

    return function attempt() {
        var args = arguments;
        var thisValue = this;

        return Promise.resolve()
            .then(function() {
                return action.apply(thisValue, args);
            })
            .then(function(result) {
                attemptsRemaining -= 1;
                if (attemptsRemaining === 0) {
                    return result;
                }

                return q.resolve(when.call(thisValue, result))
                    .then(function(shouldRetry) {
                        if (shouldRetry) {
                            return attempt.apply(thisValue, args);
                        }
                        return result;
                    });
            });
    };
};
