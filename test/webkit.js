'use strict';
const assert = require('chai').assert,
      sinon = require('sinon'),
      bugsWebkit = require('../lib/bugs-webkit'),
      webkit = require('../lib/metadata/webkit');

suite('webkit.bugIdFromTitle', function() {
    test('extracts bug id from https URL', function() {
        assert.strictEqual(
            webkit.bugIdFromTitle('WebKit export of https://bugs.webkit.org/show_bug.cgi?id=104805'),
            104805);
    });

    test('extracts bug id from http URL', function() {
        assert.strictEqual(
            webkit.bugIdFromTitle('WebKit export of http://bugs.webkit.org/show_bug.cgi?id=12345'),
            12345);
    });

    test('returns null when no Bugzilla URL present', function() {
        assert.strictEqual(webkit.bugIdFromTitle('some unrelated title'), null);
    });

    test('returns null on missing id parameter', function() {
        assert.strictEqual(
            webkit.bugIdFromTitle('https://bugs.webkit.org/show_bug.cgi?other=1'),
            null);
    });
});

suite('webkit.everFixed', function() {
    test('empty bugIds returns empty map without network', async function() {
        var result = await webkit.everFixed([]);
        assert.deepEqual(result, new Map());
    });

    test('returns bug objects for ever-FIXED bugs', async function() {
        var result = await webkit.everFixed([104805, 252078]);
        assert.instanceOf(result, Map);
        assert.isTrue(result.has(104805));
        assert.isTrue(result.has(252078));
        assert.equal(result.size, 2);
    });

    suite('chunking', function() {
        let sandbox;
        setup(function() {
            sandbox = sinon.createSandbox();
        });
        teardown(function() {
            sandbox.restore();
        });

        test('splits large queries into chunks of 50 IDs', async function() {
            const bugIds = Array.from({length: 120}, (_, i) => 1000 + i);
            const idsFromUrl = url => new URLSearchParams(url.split('?')[1]).get('id').split(',').map(Number);
            const get = sandbox.stub(bugsWebkit, 'get').callsFake(async function(url) {
                // Pretend every other bug was ever FIXED.
                return {bugs: idsFromUrl(url).filter(id => id % 2 === 0).map(id => ({id}))};
            });

            const result = await webkit.everFixed(bugIds);

            assert.deepEqual(get.args.map(([url]) => idsFromUrl(url)), [
                bugIds.slice(0, 50),
                bugIds.slice(50, 100),
                bugIds.slice(100, 120),
            ]);
            assert.sameMembers(
                Array.from(result.keys()),
                bugIds.filter(id => id % 2 === 0));
        });
    });
});
