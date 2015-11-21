"use strict";
var github = require('./github');
var q = require('q');

module.exports = function(number, metadata) {
	var specs = Object.keys(metadata.specs);
	if (specs.length) {
		var body = "Reviewers for this pull request are: " + join(specs);
	    return github.post('/repos/:owner/:repo/issues/:number/comments', { body: body }, { number: number });
	}
    var deferred = q.defer();
    deferred.resolve(null);
    return deferred.promise;
};

module.exports.team = team;
function team(spec) {
	return "@w3c/" + spec + "-reviewers";
}

module.exports.join = join;
function join(specs) {
	if (specs.length == 0) {
		return "";
	}
	if (specs.length == 1) {
		return team(specs[0]);
	}
	if (specs.length == 2) {
		return team(specs[0]) + " and " + team(specs[1]);
	}
	var last = specs.pop();
	return specs.map(team).join(", ") + ", and " + team(last);
}