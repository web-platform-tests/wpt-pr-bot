"use strict";

var filenames = require('./filenames'),
    paths = require('./paths'),
    rawLabels = require('./raw-labels'),
    findSpecs = require('./find-specs'),
    findOwners = require('./find-owners'),
    wg = require('./wg'),
    labels = require('./labels');

module.exports = function getMetadada(number) {
    var metadata = { issue: number };
    return filenames(number)
        .then(function(filenames) {
            metadata.filenames = filenames;
            metadata.paths = paths(metadata.filenames);
            metadata.rawLabels = rawLabels(metadata.paths);
            return findSpecs(metadata.rawLabels);
        }).then(function(specs) {
            metadata.specs = specs;
            metadata.workingGroups = wg(specs);
            metadata.labels = labels(metadata);
        }).then(function() {
            return findOwners(metadata.paths).then(function(owners) {
                metadata.owners = owners;
            }); 
        }).then(function() { return metadata; });
};