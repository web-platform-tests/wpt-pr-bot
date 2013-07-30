var assert = require('assert'),
    label = require('../lib/label');

suite('Test github labels abstraction', function() {
    test('getLabelsFromFiles must return root dir of filename as label', function() {
        assert.equal("foo", label.getLabelsFromFiles([{filename: "foo/bar/baz"}])[0]);
    });
    
    test('getLabelsFromFiles must return correct shortname of spec for directories which used to be spelled incorrectly', function() {
        assert.equal("shadow-dom", label.getLabelsFromFiles([{filename: "ShadowDOM"}])[0]);
    });
    
    test('getLabelsFromFiles must return "infra" for content identified as such', function() {
        assert.equal("infra", label.getLabelsFromFiles([{filename: ".gitignore"}])[0]);
    });
});