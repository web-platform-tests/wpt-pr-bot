const assert = require('assert'),
      bugsWebkit = require('../lib/bugs-webkit');

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
