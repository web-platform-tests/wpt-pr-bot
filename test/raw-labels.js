var assert = require('assert'),
    rawLabels = require('../lib/metadata/raw-labels');

suite('Test raw labels', function() {
    test('rawLabels must return root dir of filename as label', function() {
        assert.equal("foo", rawLabels(["foo/bar/baz"])[0]);
    });
    
    test('rawLabels must return correct shortname of spec for directories which used to be spelled incorrectly', function() {
        assert.equal("shadow-dom", rawLabels(["ShadowDOM"])[0]);
    });
    
    test('rawLabels must return "infra" for content identified as such', function() {
        assert.equal("infra", rawLabels([".gitignore"])[0]);
    });
    
    test('rawLabels must return "infra" for rootdir files', function() {
        assert.equal("infra", rawLabels(["some-file-in-root-dir.html"])[0]);
    });
    
    test('rawLabels must return value of sub directory for css specs', function() {
        assert.equal("css-align-3", rawLabels(["css/css-align-3"])[0]);
    });
});