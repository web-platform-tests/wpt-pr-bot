'use strict';

var assert = require('chai').assert,
    sinon = require('sinon'),
    bugsWebkit = require('../lib/bugs-webkit'),
    webkit = require('../lib/metadata/webkit');

suite('webkit.flags', function() {
    var sandbox;

    setup(function() {
        sandbox = sinon.createSandbox();
    });

    teardown(function() {
        sandbox.restore();
    });

    function stubHistory(history) {
        sandbox.stub(bugsWebkit, 'get')
            .withArgs('/rest/bug/:id/history', { id: '12345' })
            .resolves({ bugs: [ { history: history } ] });
    }

    function resolvedFixedBy(who) {
        return {
            who: who,
            changes: [
                { field_name: 'status', removed: 'NEW', added: 'RESOLVED' },
                { field_name: 'resolution', removed: '', added: 'FIXED' },
            ],
        };
    }

    [
        'ews-feeder',
        'commit-queue',
        'ews-feeder@webkit.org',
        'commit-queue@webkit.org',
    ].forEach(function(who) {
        test(`treats a bug resolved FIXED by ${who} as reviewed`, async function() {
            stubHistory([ resolvedFixedBy(who) ]);
            var flags = await webkit.flags('12345');
            assert.deepEqual(flags, { reviewed: true, inCommit: true });
        });
    });

    [
        'annevk',
        'ews-feeder@example.com',
        undefined,
    ].forEach(function(who) {
        test(`does not treat a bug resolved FIXED by ${who} as reviewed`, async function() {
            stubHistory([ resolvedFixedBy(who) ]);
            var flags = await webkit.flags('12345');
            assert.deepEqual(flags, { reviewed: false, inCommit: false });
        });
    });

    test('treats review+ as reviewed', async function() {
        stubHistory([ {
            who: 'reviewer',
            changes: [
                { field_name: 'flagtypes.name', removed: 'review?', added: 'review+' },
            ],
        } ]);
        var flags = await webkit.flags('12345');
        assert.deepEqual(flags, { reviewed: true, inCommit: false });
    });
});
