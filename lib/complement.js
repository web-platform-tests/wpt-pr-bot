module.exports = function complement(a, b) {
    var c = [];
    b.forEach(function(item) {
        if (a.indexOf(item) < 0) {
            c.push(item);
        }
    });
    return c;
};