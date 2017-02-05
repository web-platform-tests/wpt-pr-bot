var assert = require('assert'),
    rawLabels = require('../lib/metadata/raw-labels');

suite('Test raw labels', function() {
    test('rawLabels must return root dir of filename as label', function() {
        assert.deepEqual(["foo"], rawLabels(["foo/bar/baz"]));
    });
    
    test('rawLabels must return correct shortname of spec for directories which used to be spelled incorrectly', function() {
        assert.deepEqual(["shadow-dom"], rawLabels(["ShadowDOM/file.html"]));
    });
    
    test('rawLabels must return "infra" for content identified as such', function() {
        assert.deepEqual(["infra"], rawLabels([".gitignore"]));
    });
    
    test('rawLabels must return "infra" for rootdir files', function() {
        assert.deepEqual(["infra"], rawLabels(["some-file-in-root-dir.html"]));
    });
    
    test('rawLabels must return value of sub directory for css specs', function() {
        assert.deepEqual(["css-align-3"], rawLabels(["css/css-align-3/some-weird/path.html"]));
    });
    
    test('rawLabels must never return an empty string', function() {
        assert.deepEqual([], rawLabels([""]));
    });
    
    test('rawLabels must not return duplicates', function() {
        assert.deepEqual(["html"], rawLabels(["html/some/path/to/file.html", "html/some/other/path/to/file.html"]));
    });
});