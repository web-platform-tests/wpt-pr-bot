var assert = require('assert'),
    paths = require('../lib/metadata/paths');

suite('paths', function() {
    test('returns the directory of a path', function() {
        assert.deepEqual(["foo"], paths(["foo/bar.js"]));
    });
	
    test('collapses multiple files in the same director directory to a single one', function() {
        assert.deepEqual(["foo"], paths(["foo/bar.js", "foo/baz.js"]));
    });
	
    test('returns an empty string for root dirs', function() {
        assert.deepEqual(["", "foo"], paths(["foo.js", "foo/bar.js"]));
    });
	
    test('sorts paths alphabetically', function() {
        assert.deepEqual(["alpha", "beta", "gamma"], paths(["gamma/bar.js", "alpha/bar.js", "beta/bar.js"]));
    });
});