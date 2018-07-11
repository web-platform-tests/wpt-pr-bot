"use strict";
var uniq = require('../uniq');

module.exports = function paths(filenames) {
    var paths = filenames.map(function(fn) {
        return fn.replace(/(?:\/|^)[^/]+$/, "")
    });
    return uniq(paths).sort();
};

