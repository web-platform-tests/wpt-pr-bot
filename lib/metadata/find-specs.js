"use strict";
var specref = require('../specref');

module.exports = function findSpecs(labels) {
    return specref.get(labels).then(function(specref) {
		var output = {};
		labels.forEach(function(id) {
			var ref = specref[id];
			if (!ref) return;
		    while (ref.aliasOf) {
				ref = specref[ref.aliasOf];
		    }
			output[id] = ref;
		});
		return output;
    });
};

