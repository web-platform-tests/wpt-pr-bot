"use strict";
var uniq = require('../uniq');

module.exports = function labels(metadata) {
    var labels = [];
	labels.push.apply(labels, metadata.rawLabels);
	var wgs = metadata.workingGroups.map(function(shortname) { return "wg-" + shortname; })
	labels.push.apply(labels, wgs);
	return uniq(labels);
};

