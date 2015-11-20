var assert = require('assert'),
    complement = require('../lib/complement');

suite('complement', function() {
    test('complement returns an empty array when no complements are found', function() {
        assert.deepEqual([], complement(["baz"], ["baz"]));
        assert.deepEqual([], complement(["baz", "foo"], ["baz"]));
        assert.deepEqual([], complement(["baz", "foo"], []));
        assert.deepEqual([], complement([], []));
    });
	
    test('complement returns the extra elements found in the second array', function() {
        assert.deepEqual(["foo", "bar"], complement(["baz"], ["foo", "bar", "baz"]));
        assert.deepEqual(["baz"], complement([], ["baz"]));
    });
});