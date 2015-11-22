"use strict";

var filenames = require('./filenames'),
	rawLabels = require('./raw-labels'),
    findSpecs = require('./find-specs'),
    wg = require('./wg'),
	labels = require('./labels');

module.exports = function getMetadada(number) {
	var metadata = { issue: number };
    return filenames(number)
		.then(function(filenames) {
			metadata.filenames = filenames;
			metadata.rawLabels = rawLabels(labels);
			return findSpecs(metadata.rawLabels);
		}).then(function(specs) {
			metadata.specs = specs;
			metadata.workingGroups = wg(specs);
			metadata.labels = labels(metadata);
			return metadata;
		});
};