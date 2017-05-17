"use strict";

var filenames = require('./filenames'),
    paths = require('./paths'),
    rawLabels = require('./raw-labels'),
    findSpecs = require('./find-specs'),
    findOwners = require('./find-owners'),
    wg = require('./wg'),
    status = require('./status'),
    labels = require('./labels'),
    getReviewers = require('./get-reviewers'),
    funk = require('../funk'),
    github = require('../github');

module.exports = function getMetadada(number, author, content) {
    var metadata = {
        issue: number,
        rootReviewers: ["jgraham"]
    };
    author = author.toLowerCase();
    return filenames(number)
        .then(function(filenames) {
            metadata.filenames = filenames.all;
            metadata.filenamesIgnoreRemoved = filenames.ignoreRemoved;
            metadata.paths = paths(metadata.filenames);
            metadata.rawLabels = rawLabels(metadata.filenames);
            metadata.isRoot = metadata.filenames.some(function(path) {
                return path.split('/').length == 1
            });
            metadata.isReviewable = metadata.isRoot || metadata.filenames.some(function(path) {
                var dir = path.split('/')[0];
                return dir == "tools" || dir == "resources";
            });
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
        }).then(function(permission) {
            metadata.author = {
                login: author,
                permission: permission
            };
        }).then(function() {
            metadata.ownersExcludingAuthor = metadata.owners.filter(function(owner) {
                return owner.login != metadata.author.login;
            });

            metadata.author.isOwner = metadata.owners.some(function(owner) {
                return owner.login == metadata.author.login;
            });
        }).then(function() {
            return github.get('/repos/:owner/:repo/pulls/:number/requested_reviewers', { number: number }).then(function(requestedReviewers) {
                var reviewers = requestedReviewers.map(function(r) { return r.login.toLowerCase(); });
                return github.get('/repos/:owner/:repo/pulls/:number/reviews', { number: number }).then(function(reviews) {
                    reviews.forEach(function(r) {
                        if (r.user && r.user.login) {
                            var login = r.user.login.toLowerCase();
                            if (reviewers.indexOf(login) < 0) {
                                reviewers.push(login);
                            }
                        }
                    });
                    reviewers.sort();
                    metadata.reviewers = reviewers;
                });
            });
        }).then(function() {
        metadata.isMergeable = metadata.isRoot || // That only works because rootReviewers are hard-coded and we know them.
            metadata.author.permission == "admin" ||
            metadata.author.permission == "write" ||
            metadata.owners.some(function(owner) {
                return owner.permission == "admin" || owner.permission == "write";
            });
            // The above is missing the case where a reviewer which has write permission and is not an owner was added.
            metadata.reviewedDownstream = (metadata.author.login == "chromium-wpt-export-bot") ||
                (metadata.author.login == "jgraham" && content.indexOf("MozReview-Commit-ID") > -1);
            
            metadata.missingReviewers = getReviewers(metadata);
            
            return metadata;
        });        
};