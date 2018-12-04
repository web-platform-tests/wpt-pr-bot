"use strict";
var github = require('../github'),
    uniq = require('../uniq'),
    yaml = require('js-yaml'),
    q = require('q');

function getReviewersFile(path, reviewers) {
    return github.get("/repos/:owner/:repo/contents/:path", { path: path + "/META.yml" })
        .then(function(file) {
            if (file.type != "file") {
                throw new Error("Something's up!");
            }
            parse(decode(file.content)).forEach(function(reviewer) {
                reviewers.push(reviewer);
            });

            path = parentDir(path);

            if (path) {
                return getReviewersFile(path, reviewers);
            }
        }).catch(function() { // There is no META.yml file in this dir
            path = parentDir(path);

            if (path) {
                return getReviewersFile(path, reviewers);
            }
        });
}

function parentDir(path) {
    path = path.split("/");
    if (path.length == 1) {
        return "";
    }
    path.pop();
    return path.join("/");
}

module.exports = function(_directories) {
    var reviewers = [];
    var directories = _directories.slice(0);
    var deferred = q.defer();
    function next() {
        if (directories.length) {
            var dir = directories.pop();
            getReviewersFile(dir, reviewers).then(next);
        } else {
            reviewers = uniq(reviewers);
            reviewers.sort();
            deferred.resolve(reviewers);
        }
    }
    next();
    return deferred.promise;
};

module.exports.decode = decode;
function decode(content) {
    return new Buffer(content, "base64").toString("utf8");
}

module.exports.parse = parse;
function parse(content) {
    try {
        return yaml.safeLoad(content).suggested_reviewers;
    } catch(e) {
        throw new Error("unable to parse yaml: " + e);
    }
}



