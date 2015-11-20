"use strict";
var rawLabels = require('./raw-labels'),
    findSpecs = require('./find-specs'),
    wg = require('./wg'),
	labels = require('./labels');

module.exports = function getMetadada(number) {
	console.log("rawLabels", number)
	var metadata = { issue: number };
    return rawLabels.fromIssue(number)
		.then(function(labels) {
			console.log("rawLabels", labels)
			metadata.rawLabels = labels;
			return findSpecs(labels);
		}).then(function(specs) {
			metadata.specs = specs;
			metadata.workingGroups = wg(specs);
			metadata.labels = labels(metadata);
			return metadata;
		});
};