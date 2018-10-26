'use strict';
var assert = require('assert');

var q = require('q');

var retry = require('../lib/retry');

suite('retry', function() {
    suite('invocation of "action" function', function() {
        var expectedThis = {};
        var actualThis, actualArgs;
        var action = function() {
            actualThis = this;
            actualArgs = Array.prototype.slice.call(arguments);
        };
        setup(function() {
            actualThis = null;
            actualArgs = null;
        });

        test('first invocation', function() {
            return retry({
                maxAttempts: 1,
                action: action,
                when: function() {}
            }).call(expectedThis, 1, 2, 3).then(function() {
                assert.deepEqual(actualArgs, [1, 2, 3]);
                assert.equal(actualThis, expectedThis);
            });
        });

        test('subsequent invocations', function() {
            return retry({
                maxAttempts: 2,
                action: action,
                when: function() { return true; },
            }).call(expectedThis, 1, 2, 3).then(function() {
                assert.deepEqual(actualArgs, [1, 2, 3]);
                assert.equal(actualThis, expectedThis);
            });
        });
    });

    suite('invocation of "when" function', function() {
        var expectedThis = {};
        var expectedArg = {};
        var actualThis, actualArgs;
        var action = function() { return expectedArg; };
        var when = function() {
            actualThis = this;
            actualArgs = Array.prototype.slice.call(arguments);
            return true;
        };
        setup(function() {
            actualThis = null;
            actualArgs = null;
        });

        test('first invocation', function() {
            return retry({
                maxAttempts: 2,
                action: action,
                when: when
            }).call(expectedThis).then(function() {
                assert.deepEqual(actualArgs, [expectedArg]);
                assert.equal(actualThis, expectedThis);
            });
        });

        test('subsequent invocations', function() {
            return retry({
                maxAttempts: 3,
                action: action,
                when: when
            }).call(expectedThis).then(function() {
                assert.deepEqual(actualArgs, [expectedArg]);
                assert.equal(actualThis, expectedThis);
            });
        });
    });

    test('resolution value', function() {
        var expected = {};
        var action = function() { return q.resolve(expected); };
        var when = function() { return false; };

        return retry({
            maxAttempts: 1,
            action: action,
            when: when
        })().then(function(actual) {
            assert.equal(actual, expected);
        });
    });

    test('exception value', function() {
        var expected = {};
        var action = function() { throw expected; };
        var when = function() { return false; };

        return retry({
            maxAttempts: 1,
            action: action,
            when: when
        })().then(function() {
            throw new Error('This promise should not be fulfilled.');
        }, function(actual) {
            assert.equal(actual, expected);
        });
    });

    test('rejection value', function() {
        var expected = {};
        var action = function() { return q.reject(expected); };
        var when = function() { return false; };

        return retry({
            maxAttempts: 1,
            action: action,
            when: when
        })().then(function() {
            throw new Error('This promise should not be fulfilled.');
        }, function(actual) {
            assert.equal(actual, expected);
        });
    });

    test('retry until maxAttempts', function() {
        var callCount = 0;
        var action = function() { callCount += 1; };
        var when = function() { return true; };

        return retry({
            maxAttempts: 23,
            action: action,
            when: when
        })().then(function() {
            assert.equal(callCount, 23);
        });
    });

    test('retry until "when" - synchronous', function() {
        var callCount = 0;
        var action = function() { callCount += 1; };
        var when = function() { return callCount < 14; };

        return retry({
            maxAttempts: 23,
            action: action,
            when: when
        })().then(function() {
            assert.equal(callCount, 14);
        });
    });

    test('retry until "when" - asynchronous', function() {
        var callCount = 0;
        var action = function() { callCount += 1; };
        var when = function() { return q.resolve(callCount < 14); };

        return retry({
            maxAttempts: 23,
            action: action,
            when: when
        })().then(function() {
            assert.equal(callCount, 14);
        });
    });

    test('reject on "when" exeception', function() {
        var expected = {};
        var when = function() { throw expected; };

        return retry({
            maxAttempts: 2,
            action: function() {},
            when: when
        })().then(function() {
            throw new Error('this promise should not be fulfilled');
        }, function(actual) {
            assert.equal(actual, expected);
        });
    });

    test('reject on "when" rejection', function() {
        var expected = {};
        var when = function() { return q.reject(expected); };

        return retry({
            maxAttempts: 2,
            action: function() {},
            when: when
        })().then(function() {
            throw new Error('this promise should not be fulfilled');
        }, function(actual) {
            assert.equal(actual, expected);
        });
    });
});
