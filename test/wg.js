var assert = require('assert'),
    wg = require('../lib/metadata/wg');

suite('wg', function() {
    test('wg returns an empty array when no specs are found', function() {
        assert.deepEqual([], wg({}));
    });
	
    test('wg returns an empty array when no specs with a wg are found', function() {
        assert.deepEqual([], wg({ foo: {} }));
    });
	
    test('wg returns the working group shortname when a working group is present', function() {
        assert.deepEqual(["html"], wg({ foo: { deliveredBy: [{ shortname: "html" }] } }));
    });
	
    test('wg returns both working groups shortname when a spec is a joint delivery', function() {
        assert.deepEqual(["html", "webapps"], wg({ foo: { deliveredBy: [{ shortname: "html" }, { shortname: "webapps" }] } }));
    });
	
    test('wg returns groups only once', function() {
        assert.deepEqual(["html", "webapps"], wg({
			foo: { deliveredBy: [{ shortname: "html" }, { shortname: "webapps" }] },
			bar: { deliveredBy: [{ shortname: "webapps" }] }
		}));
    });
});