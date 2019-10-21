"use strict";

const assert = require('assert'),
      filter = require('../lib/filter');

function nullLog() {
    // Do nothing. Log messages could be verified but aren't.
}

suite('Event filtering', function() {
    test('null body', function() {
        assert.strictEqual(filter.event(null, nullLog), false);
    });
    test('empty body', function() {
        assert.strictEqual(filter.event({}, nullLog), true);
    });
    test('wpt-pr-bot sender', function() {
        assert.strictEqual(filter.event({
            sender: {
                login: 'wpt-pr-bot'
            }
        }, nullLog), false);
    });
    test('other sender', function() {
        assert.strictEqual(filter.event({
            sender: {
                login: 'some-other-user'
            }
        }, nullLog), true);
    });

});

suite('Pull request filtering', function() {
    test('null payload', function() {
        assert.throws(function() {
            filter.pullRequest(null, nullLog);
        });
    });
    test('empty payload', function() {
        assert.strictEqual(filter.pullRequest({}, nullLog), true);
    });
    test('closed pull request', function() {
        assert.strictEqual(filter.pullRequest({state: "closed"}, nullLog), false);
    });
    test('open pull request', function() {
        assert.strictEqual(filter.pullRequest({state: "open"}, nullLog), true);
    });
    test('draft pull request', function() {
        assert.strictEqual(filter.pullRequest({draft: true}, nullLog), false);
    });
    test('explicitly non-draft pull request', function() {
        assert.strictEqual(filter.pullRequest({draft: false}, nullLog), true);
    });
});
