"use strict";

// Split an array into consecutive chunks of at most `size` items.
module.exports = function chunks(array, size) {
    return Array.from(
        {length: Math.ceil(array.length / size)},
        (_, i) => array.slice(i * size, (i + 1) * size));
};
