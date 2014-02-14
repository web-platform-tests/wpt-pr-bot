var assert = require('assert'),
    label = require('../lib/label');

suite('Test github labels abstraction', function() {
    test('getLabelsFromFiles must return root dir of filename as label', function() {
        assert.equal("foo", label.getLabelsFromFiles([{filename: "foo/bar/baz"}])[0]);
    });

    test('getLabelsFromSpecs must return dap and webrtc for mediacapture-streams files', function(done) {
	label.getLabelsFromSpecs(["mediacapture-streams"]).then(function (labels) { assert.deepEqual(["wg-dap", "wg-webrtc", "mediacapture-streams"], labels[0].value); done()}).fail(done);
    });
	
	if (process.env.GITHUB_TOKEN) {
	    test('getLabelsFromIssue must return dap, webrtc and mediacapture-streams for pull request 160', function(done) {
		label.getLabelsFromIssue(160).then(function (labels) { assert.deepEqual(["wg:dap", "wg:webrtc", "mediacapture-streams"], labels); done()}).fail(done);
	    });	
	}

    
    test('getLabelsFromFiles must return correct shortname of spec for directories which used to be spelled incorrectly', function() {
        assert.equal("shadow-dom", label.getLabelsFromFiles([{filename: "ShadowDOM"}])[0]);
    });
    
    test('getLabelsFromFiles must return "infra" for content identified as such', function() {
        assert.equal("infra", label.getLabelsFromFiles([{filename: ".gitignore"}])[0]);
    });
});