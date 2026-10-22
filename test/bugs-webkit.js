'use strict';

const assert = require('chai').assert,
      fetch = require('node-fetch'),
      replay = require('replay'),
      bugsWebkit = require('../lib/bugs-webkit');

suite('bugs-webkit', function() {
    const token = 'fake-bugzilla-key-1234';

    setup(function() {
        // Relies on replay refusing requests that have no fixture.
        if (replay.mode !== 'replay') {
            this.skip();
        }
        bugsWebkit.setToken(token);
    });

    teardown(function() {
        // The placeholder that test/setup.js uses in replay mode.
        bugsWebkit.setToken('REDACTED');
    });

    test('redacts the API key from fetch errors', async function() {
        let error;
        try {
            // There is no fixture for this bug, so the request fails.
            await bugsWebkit.get('/rest/bug/:id', { id: 0 });
        } catch (e) {
            error = e;
        }
        assert.instanceOf(error, fetch.FetchError);
        assert.equal(error.type, 'system');
        assert.equal(error.code, 'ECONNREFUSED');
        assert.include(error.message, 'Bugzilla_api_key=REDACTED');
        assert.notInclude(error.message, token);
        assert.notInclude(error.stack, token);
    });
});

suite('bugs-webkit errFrom', function() {
    test('errFrom uses the message and errors of a Bugzilla JSON error', function() {
        const body = JSON.stringify({message: "Bug not found", errors: ["oops"]});
        const err = bugsWebkit._errFrom({status: 404}, body);
        assert.equal(err.message, "Bug not found");
        assert.deepEqual(err.errors, ["oops"]);
        assert.equal(err.statusCode, 404);
    });

    test('errFrom falls back to the HTTP status for a non-JSON body', function() {
        const err = bugsWebkit._errFrom({status: 403}, "<html><body>Forbidden</body></html>");
        assert.equal(err.message, "HTTP 403");
        assert.equal(err.statusCode, 403);
    });
});
