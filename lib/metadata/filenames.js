"use strict";
var github = require('../github'),
	funk = require('../funk');
    
module.exports = function(issue) {
    return github.get("/repos/:owner/:repo/pulls/:number/files", { number: issue })
		.then(function(files) {
			return files.map(funk.prop('filename'));
		});
};

