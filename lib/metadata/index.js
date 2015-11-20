"use strict";
var rawLabels = require('./raw-labels'),
    findSpecs = require('./find-specs'),
    wg = require('./wg'),
	labels = require('./labels');

module.exports = function getMetadada(issue) {
	var metadata = { issue: issue };
    return rawLabels.fromIssue(issue)
		.then(function(labels) {
			metadata.rawLabels = labels;
			return findSpecs(labels);
		}).then(function(specs) {
			metadata.specs = specs;
			metadata.workingGroups = wg(specs);
			metadata.labels = labels(metadata);
			return metadata;
		});
};