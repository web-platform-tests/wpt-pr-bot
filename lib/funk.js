// istanbul ignore file

"use strict";
exports.prop = prop;
function prop(propName) {
    return function(obj) {
        return obj[propName];
    };
}
