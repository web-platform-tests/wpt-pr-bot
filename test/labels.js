var assert = require('assert'),
    label = require('../lib/label');

suite('Test github labels abstraction', function() {
    test('getLabelsFromSpecs must return dap and webrtc for mediacapture-streams files', function(done) {
		label.getLabelsFromSpecs(["mediacapture-streams"]).then(function (labels) {
			assert.deepEqual(["wg-dap", "wg-webrtc", "mediacapture-streams"], labels[0].value);
			done();
		}).fail(done);
    });
	
	if (process.env.GITHUB_TOKEN) {
	    test('getLabelsFromIssue must return dap, webrtc and mediacapture-streams for pull request 160', function(done) {
			label.getLabelsFromIssue(160).then(function (labels) {
				assert.deepEqual(["wg:dap", "wg:webrtc", "mediacapture-streams"], labels);
				done();
			}).fail(done);
	    });	
	}

    test('findExtraLabels returns the newly added labels only', function() {
        assert.deepEqual(["foo", "bar"], label.findExtraLabels(["baz"], ["foo", "bar", "baz"]));
        assert.deepEqual([], label.findExtraLabels(["baz"], ["baz"]));
        assert.deepEqual([], label.findExtraLabels(["baz"], []));
    });
});