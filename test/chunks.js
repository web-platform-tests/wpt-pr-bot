const assert = require('assert'),
      chunks = require('../lib/chunks');

suite('chunks', function() {
    test('chunks returns an empty array for an empty array', function() {
        assert.deepEqual(chunks([], 3), []);
    });

    test('chunks returns a single chunk when the array fits', function() {
        assert.deepEqual(chunks([1, 2, 3], 3), [[1, 2, 3]]);
        assert.deepEqual(chunks([1], 3), [[1]]);
    });

    test('chunks splits into chunks of the given size, with a shorter final chunk', function() {
        assert.deepEqual(chunks([1, 2, 3, 4, 5, 6], 3), [[1, 2, 3], [4, 5, 6]]);
        assert.deepEqual(chunks([1, 2, 3, 4, 5, 6, 7], 3), [[1, 2, 3], [4, 5, 6], [7]]);
    });

    test('chunks does not modify its input', function() {
        const input = [1, 2, 3, 4];
        chunks(input, 2);
        assert.deepEqual(input, [1, 2, 3, 4]);
    });
});
