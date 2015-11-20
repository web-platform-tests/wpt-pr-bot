var assert = require('assert'),
    rawLabels = require('../lib/raw-labels');

suite('Test github raw labels abstraction', function() {
    test('fromFiles must return root dir of filename as label', function() {
        assert.equal("foo", rawLabels.fromFiles([{filename: "foo/bar/baz"}])[0]);
    });
	
	if (process.env.GITHUB_TOKEN) {
	    test('fromIssue must return dap, webrtc and mediacapture-streams for pull request 160', function(done) {
			rawLabels.fromIssue(160).then(function (labels) {
				assert.deepEqual(["wg:dap", "wg:webrtc", "mediacapture-streams"], labels);
				done();
			}).fail(done);
	    });	
	}

    
    test('fromFiles must return correct shortname of spec for directories which used to be spelled incorrectly', function() {
        assert.equal("shadow-dom", rawLabels.fromFiles([{filename: "ShadowDOM"}])[0]);
    });
    
    test('fromFiles must return "infra" for content identified as such', function() {
        assert.equal("infra", rawLabels.fromFiles([{filename: ".gitignore"}])[0]);
    });
});