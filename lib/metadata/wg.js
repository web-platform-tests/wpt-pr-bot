"use strict";
var uniq = require('../uniq');

module.exports = function wg(specs) {
    var output = [];
    Object.keys(specs).forEach(function(id) {
        var ref = specs[id];
        if (ref.deliveredBy) {
            ref.deliveredBy.forEach(function(wg) {
                output.push(wg.shortname);
            });
        }
    });
    return uniq(output);
};

