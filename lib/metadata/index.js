"use strict";

var filenames = require('./filenames'),
    paths = require('./paths'),
    rawLabels = require('./raw-labels'),
    isSafe = require('./is-safe'),
    testUrls = require('./test-urls'),
    findSpecs = require('./find-specs'),
    findOwners = require('./find-owners'),
    wg = require('./wg'),
    labels = require('./labels');

module.exports = function getMetadada(number, author) {
    var metadata = {
        issue: number,
        author: author ? "@" + author : null
    };
    return filenames(number)
        .then(function(filenames) {
            metadata.filenames = filenames;
            metadata.paths = paths(filenames);
            metadata.rawLabels = rawLabels(filenames);
            metadata.isSafe = isSafe(filenames);
            metadata.testUrls = testUrls(number, filenames, metadata.paths);
            return findSpecs(metadata.rawLabels);
        }).then(function(specs) {
            metadata.specs = specs;
            metadata.workingGroups = wg(specs);
            metadata.labels = labels(metadata);
        }).then(function() {
            return findOwners(metadata.paths);
        }).then(function(owners) {
            metadata.owners = owners; 
        }).then(function() { return metadata; });
};