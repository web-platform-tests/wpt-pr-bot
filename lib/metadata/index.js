"use strict";

var filenames = require('./filenames'),
    paths = require('./paths'),
    rawLabels = require('./raw-labels'),
    findSpecs = require('./find-specs'),
    findOwners = require('./find-owners'),
    wg = require('./wg'),
    status = require('./status'),
    labels = require('./labels'),
    funk = require('../funk'),
    github = require('../github');

module.exports = function getMetadada(number, author, content) {
    var metadata = {
        issue: number
    };
    
    return filenames(number)
        .then(function(filenames) {
            metadata.filenames = filenames.all;
            metadata.filenamesIgnoreRemoved = filenames.ignoreRemoved;
            metadata.paths = paths(metadata.filenames);
            metadata.rawLabels = rawLabels(metadata.filenames);
            return findSpecs(metadata.rawLabels);
        }).then(function(specs) {
            metadata.specs = specs;
            metadata.workingGroups = wg(specs);
            metadata.labels = labels(metadata);
        }).then(function() {
            return findOwners(metadata.paths)
        }).then(function(owners) {
            return status(owners);
        }).then(function(owners) {
            metadata.owners = owners;
        }).then(function() {
            return status(author);
        }).then(function(status) {
            metadata.author = {
                login: author,
                permission: permission
            };
        }).then(function() {
            metadata.isMergeable = metadata.author.permission == "admin" ||
                metadata.author.permission == "write" ||
                metadata.owners.some(function(owner) {
                    return owner.permission == "admin" || owner.permission == "write";
                });

            metadata.ownersExcludingAuthor = metadata.owners.filter(function(owner) {
                return owner.login != metadata.author.login;
            });

            metadata.author.isOwner = metadata.owners.some(function(owner) {
                return owner.login == metadata.author.login;
            });
        }).then(function() {
            return github.get('/repos/:owner/:repo/pulls/:number/requested_reviewers', { number: number }).then(function(reviewers) {
                metadata.reviewers = reviewers.map(function(r) { return r.login }).sort();
            });
        }).then(function() {
            metadata.reviewedUpstream = (metadata.author.login == "chromium-wpt-export-bot") ||
                (metadata.author.login == "jgraham" && content.indexOf("MozReview-Commit-ID") > -1);
            return metadata;
        });        
};