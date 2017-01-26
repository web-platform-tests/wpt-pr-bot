var assert = require('assert'),
    reviewers = require('../lib/comment');

suite('Test reviewers', function() {
    test('With one reviewer', function() {
		assert.equal("@foo", reviewers.join(["@foo"]))
    });
	
    test('With no reviewers', function() {
		assert.equal("", reviewers.join([]))
    });
	
    test('With two reviewers', function() {
		assert.equal("@foo and @bar", reviewers.join(["@foo", "@bar"]))
    });
	
    test('With three reviewers', function() {
		assert.equal("@foo, @bar, and @baz", reviewers.join(["@foo", "@bar", "@baz"]))
    });
});