'use strict';

var assert = require('chai').assert,
    sinon = require('sinon'),
    commitsWebkit = require('../lib/commits-webkit');

suite('commits-webkit', function() {
    var sandbox, fetch;

    setup(function() {
        sandbox = sinon.createSandbox();
        fetch = sandbox.stub(commitsWebkit, 'fetch');
    });

    teardown(function() {
        sandbox.restore();
    });

    function respond(status, body) {
        fetch.resolves({
            status: status,
            ok: status >= 200 && status < 300,
            json: async () => body,
        });
    }

    test('retrieves a commit by git identifier', async function() {
        var commit = { hash: 'abc', branch: 'main', identifier: '324168@main' };
        respond(200, commit);
        assert.deepEqual(await commitsWebkit.get('324168@main'), commit);
        assert.equal(fetch.firstCall.args[0], 'https://commits.webkit.org/324168@main/json');
    });

    test('retrieves a commit by Subversion revision', async function() {
        var commit = { hash: 'def', branch: 'main', revision: 266816 };
        respond(200, commit);
        assert.deepEqual(await commitsWebkit.get('r266816'), commit);
        assert.equal(fetch.firstCall.args[0], 'https://commits.webkit.org/r266816/json');
    });

    test('returns null for a commit that does not exist', async function() {
        respond(404, { message: 'No commit with the specified reference could be found' });
        assert.isNull(await commitsWebkit.get('999999999@main'));
    });

    test('throws on other errors', async function() {
        respond(503, {});
        try {
            await commitsWebkit.get('324168@main');
            assert.fail('expected an error');
        } catch (e) {
            assert.include(e.message, '503');
        }
    });

    [
        '324168@safari-7620-branch',
        '../324168@main',
        '324168@main/../../evil',
        'abcdef',
        '',
        undefined,
    ].forEach(function(ref) {
        test(`rejects invalid reference ${JSON.stringify(ref)}`, async function() {
            try {
                await commitsWebkit.get(ref);
                assert.fail('expected an error');
            } catch (e) {
                assert.include(e.message, 'Invalid WebKit commit reference');
            }
            assert.isFalse(fetch.called);
        });
    });
});
