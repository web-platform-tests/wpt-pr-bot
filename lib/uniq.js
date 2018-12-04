module.exports = function uniq(array) {
    var output = [];
    array.forEach(function(item) {
        if (output.indexOf(item) < 0) {
            output.push(item);
        }
    });
    return output;
};
