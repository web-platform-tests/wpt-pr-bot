"use strict";
var specref = require('../specref');

module.exports = async function findSpecs(labels) {
    labels = labels.filter(function(label) { return label != "infra"; });
    const spec = await specref.get(labels);
    var output = {};
    labels.forEach(function(id) {
        var ref = spec[id];
        if (!ref) return;
        while (ref.aliasOf) {
            ref = spec[ref.aliasOf];
        }
        output[id] = ref;
    });
    return output;
};

