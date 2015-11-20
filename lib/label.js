"use strict";
var github = require('./github'),
    funk = require('./funk'),
    q = require('q'),
    uniq = require('./uniq'),
    complement = require('./complement'),
	rawLabels = require('./raw-labels'),
	labelModel = require('./label-model'),
	specref = require('./specref');

exports.setLabelsOnIssue = setLabelsOnIssue;
function setLabelsOnIssue(issue) {
    return getLabelsFromIssue(issue).then(funk.curry(labelModel.post, issue));
}

function _wgsFromSpecref(spec) {
    return function (specref) {
		var wgs = [], specData;
		if (specref && specref[spec]) {
		    specData = specref[spec];
		    while (specData["aliasOf"]) {
				specData = specref[specData["aliasOf"]];
		    }
		    if (specData["deliveredBy"]) {
				wgs = specData["deliveredBy"].map(function(wg) {
					return "wg-" + wg.shortname;
				});
		    }
		}
		wgs.push(spec);
		return wgs;
    };
}
exports.getLabelsFromIssue = getLabelsFromIssue;
function getLabelsFromIssue(issue) {
    return rawLabels.fromIssue(issue)
		.then(getLabelsFromSpecs)
		.then(_cleanupLabels);
}

function _cleanupLabels(labels) {
	return uniq(labels.map(funk.prop("value")).reduce(function (a,b) {
		return a.concat(b);
	}));
}

function _isSpec(name) {
	return !(name in rawLabels.LABEL_TO_FILENAMES);
}

exports.getLabelsFromSpecs = getLabelsFromSpecs;
function getLabelsFromSpecs(labels) {    
    var promiselist = labels.map(function (label) {
		if (_isSpec(label)) {
			return specref.get(label).then(_wgsFromSpecref(label));
		}
		var deferred;
	    deferred = q.defer();
	    deferred.resolve([label]);
	    return deferred.promise;
    });
    return q.allSettled(promiselist);
}


