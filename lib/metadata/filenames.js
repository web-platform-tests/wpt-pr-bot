"use strict";
var github = require('../github'),
    funk = require('../funk');

module.exports = async function(issue) {
    const files = await github.get("/repos/:owner/:repo/pulls/:number/files", { number: issue });
    return files.map(funk.prop('filename'));
};

