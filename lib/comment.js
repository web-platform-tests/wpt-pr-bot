"use strict";
var github = require('./github');
var q = require('q');

module.exports = function(number, metadata) {
    var owners = metadata.owners.filter(function(owner) {
        return owner != metadata.author;
    });

    if (owners.length) {
        var body = "Notifying " + join(owners) + ". *([Learn how reviewing works](https://github.com/w3c/web-platform-tests/blob/master/README.md#test-review).)*";
        return github.post('/repos/:owner/:repo/issues/:number/comments', { body: body }, { number: number });
    }

    var deferred = q.defer();
    deferred.resolve();
    return deferred.promise;
};

module.exports.join = join;
function join(owners) {
	if (owners.length == 0) {
		return "";
	}
	if (owners.length == 1) {
		return owners[0];
	}
	if (owners.length == 2) {
		return owners[0] + " and " + owners[1];
	}
	var last = owners.pop();
	return owners.join(", ") + ", and " + last;
}
