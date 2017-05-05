"use strict";

var filenames = require('./filenames'),
    paths = require('./paths'),
    rawLabels = require('./raw-labels'),
//    isSafe = require('./is-safe'),
//    testUrls = require('./test-urls'),
    findSpecs = require('./find-specs'),
    findOwners = require('./find-owners'),
    wg = require('./wg'),
    checkAuthorStatus = require('./check-author-status'),
    labels = require('./labels'),
    funk = require('../funk'),
    github = require('../github');

module.exports = function getMetadada(number, author, content) {
    var metadata = {
        issue: number,
        author: author
    };
    
    return filenames(number)
        .then(function(filenames) {
            metadata.filenames = filenames.all;
            metadata.filenamesIgnoreRemoved = filenames.ignoreRemoved;
            metadata.paths = paths(metadata.filenames);
            metadata.rawLabels = rawLabels(metadata.filenames);
//            metadata.isSafe = isSafe(filenames.ignoreRemoved);
//            metadata.testUrls = testUrls(number, filenames.ignoreRemoved, metadata.paths);
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
            return github.get("/repos/:owner/:repo/collaborators").then(function(collaborators) {
                collaborators = collaborators.map(funk.prop("login"));
                
                metadata.authorIsCollaborator = collaborators.some(function(login) {
                    return login == metadata.author;
                });
                
                var _owners = metadata.owners.filter(function(owner) {
                    return owner != metadata.author;
                })
                
                // owners which have commit rights to the repo but are not the author
                metadata.collaborators = _owners.filter(function(owner) {
                    return collaborators.indexOf(owner) > -1;
                });
                
                // owners which do not have commit rights to the repo and are not the author
                metadata.nonCollaborators = _owners.filter(function(owner) {
                    return collaborators.indexOf(owner) < 0;
                });
            });
        }).then(function() {
            return github.get('/repos/:owner/:repo/pulls/:number/requested_reviewers', { number: number }).then(function(reviewers) {
                metadata.reviewers = reviewers.map(function(r) { return r.login }).sort();
            });
        }).then(function() {
            metadata.reviewedUpstream = (metadata.author == "chromium-wpt-export-bot") ||
                (metadata.author == "jgraham" && content.indexOf("MozReview-Commit-ID") > -1);
            return metadata;
        });        
};