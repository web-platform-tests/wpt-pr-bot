"use strict";
var github = require('../github'),
    funk = require('../funk'),
    uniq = require('../uniq'),
    q = require('q');
    
function getReviewersFile(path) {
    return github.get("/repos/:owner/:repo/contents/:path", { path: path + "/OWNERS" })
        .then(function(file) {
            if (file.type == "file") {
                return parse(decode(file.content));
            }
            throw new Error("Something's up!")
        }).catch(function() {
            path = path.split("/");
            if (path.length == 1) {
                return [];
            }
            path.pop();
            return getReviewersFile(path.join("/"))
        });
}

module.exports = function(directories) {
    var owners = [];
    var directories = directories.slice(0);
    var deferred = q.defer();
    function next() {
        if (directories.length) {
            var dir = directories.pop();
            getReviewersFile(dir).then(function(handles) {
                owners.push.apply(owners, handles);
                next();
            });
        } else {
            owners = uniq(owners);
            owners.sort();
            deferred.resolve(owners);
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
    var lines = content.split("\n")
        .map(function(line) { return line.trim(); })
        .filter(function(line) { return line; }) // remove empty lines
        .filter(function(line) { return line.indexOf("#") != 0; }) // remove comments starting with #
        .filter(function(line) { return line.indexOf("//") != 0; }) // remove comments starting with //
        .map(function(line) { return line.indexOf("@") == 0 ? line.substring(1) : line; }) // remove @
        //.filter(function(line) { return /^@[a-z0-9][a-z0-9-]*/i.test(line) })) // filter handles
    return uniq(lines);
}



