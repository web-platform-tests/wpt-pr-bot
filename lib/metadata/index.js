"use strict";

var filenames = require('./filenames'),
    paths = require('./paths'),
    rawLabels = require('./raw-labels'),
    isSafe = require('./is-safe'),
    testUrls = require('./test-urls'),
    findSpecs = require('./find-specs'),
    findOwners = require('./find-owners'),
    wg = require('./wg'),
    checkAuthorStatus = require('./check-author-status'),
    labels = require('./labels');

module.exports = function getMetadada(number, author) {
    var metadata = {
        issue: number,
        author: author ? "@" + author : null
    };
    return filenames(number)
        .then(function(filenames) {
            metadata.filenames = filenames.all;
            metadata.filenamesIgnoreRemoved = filenames.ignoreRemoved;
            metadata.paths = paths(metadata.filenames);
            metadata.rawLabels = rawLabels(metadata.filenames);
            metadata.isSafe = isSafe(filenames.ignoreRemoved);
            metadata.testUrls = testUrls(number, filenames.ignoreRemoved, metadata.paths);
            return findSpecs(metadata.rawLabels);
        }).then(function(specs) {
            metadata.specs = specs;
            metadata.workingGroups = wg(specs);
            metadata.labels = labels(metadata);
        }).then(function() {
            return findOwners(metadata.paths);
        }).then(function(owners) {
            metadata.owners = owners; 
        }).then(function() {
            return checkAuthorStatus(author);
        }).then(function(status) {
            metadata.authorIsCollaborator = status;
            return metadata;
        });
};