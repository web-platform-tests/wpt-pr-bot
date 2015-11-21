var assert = require('assert'),
    reviewers = require('../lib/reviewers');

suite('Test reviewers', function() {
    test('With one spec', function() {
		assert.equal("@w3c/html-reviewers", reviewers.join(["html"]))
    });
	
    test('With no spec', function() {
		assert.equal("", reviewers.join([]))
    });
	
    test('With two specs', function() {
		assert.equal("@w3c/html-reviewers and @w3c/dap-reviewers", reviewers.join(["html", "dap"]))
    });
	
    test('With three specs', function() {
		assert.equal("@w3c/html-reviewers, @w3c/css-reviewers, and @w3c/dap-reviewers", reviewers.join(["html", "css",  "dap"]))
    });
});