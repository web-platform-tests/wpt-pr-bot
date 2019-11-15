// istanbul ignore file

"use strict";

var github = require('./github'),
    funk = require('./funk'),
    complement = require('./complement');

exports.post = post;
function post(issue, labels) {
    return get(issue).then(function(existingLabels) {
        return complement(existingLabels, labels);
    }).then(function(labels) {
        if (!labels.length) { return labels; }
        return github.post('/repos/:owner/:repo/issues/:number/labels', labels, { number: issue }).then(function(labels) {
            return labels.map(funk.prop('name'));
        });
    });
}

exports.get = get;
function get(issue) {
    return github.get('/repos/:owner/:repo/issues/:number/labels', { number: issue }).then(function(labels) {
        return labels.map(funk.prop('name'));
    });
}
