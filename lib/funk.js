"use strict";
exports.equal = equal;
function equal(a, b) {
    return a == b;
}

exports.curry = curry;
function curry(fn) {
    var args = Array.prototype.slice.call(arguments, 0);
    args[0] = void 0;
    return fn.bind.apply(fn, args);
}

exports.prop = prop;
function prop(propName) {
    return function(obj) {
        return obj[propName];
    }
}

exports.compose = compose;
function compose() {
    var funcs = arguments;
    return function() {
        var args = arguments;
        for (var i = funcs.length - 1; i >= 0; i--) {
          args = [funcs[i].apply(this, args)];
        }
        return args[0];
    }
}