var assert = require('assert'),
    notify = require('../lib/notify');

suite('clarifyLabel', function() {
    test('clarifyLabel suffixes shortNames with "-tests"', function() {
        assert.equal("html-tests", notify.clarifyLabel("html"));
        assert.equal("CSS21-tests", notify.clarifyLabel("CSS21"));
    });
    
    test('clarifyLabel prefixes assets and tools with "test-"', function() {
        assert.equal("test-assets", notify.clarifyLabel("assets"));
        assert.equal("test-infra", notify.clarifyLabel("infra"));
    });
    
    test('clarifyLabel leaves old-tests untouched', function() {
        assert.equal("old-tests", notify.clarifyLabel("old-tests"));
    });
    
    test('clarifyLabel suffixes any other string with "-tests"', function() {
        assert.equal("xxx-tests", notify.clarifyLabel("xxx"));
        assert.equal("123-tests", notify.clarifyLabel("123"));
    });
});