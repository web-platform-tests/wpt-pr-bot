"use strict";

var github = require("../github");
var q = require('q');
    
function promise(value) {
    var deferred = q.defer();
    deferred.resolve(value);
    return deferred.promise;
}

module.exports = function(arg) {
    return typeof arg == "string" ? _status(arg) : _statuses(arg);
}

function _statuses(handles) {
    handles = handles.slice(0);
    var output = [];
    var deferred = q.defer();
    
    function next() {
        if (handles.length > 0) {
            var handle = handles.pop();
            _status(handle).then(function(permission) {
                output.push({ login: handle, permission: permission });
                next();
            }, function(err) { deferred.reject(err) });
        } else {
            deferred.resolve(output);
        }
    }
    next();
    return deferred.promise;
}


function _status(handle) {
    return github.get("/repos/:owner/:repo/collaborators/:username", { username: handle }).then(function() {
        return github.get("/repos/:owner/:repo/collaborators/:username/permission", { username: handle }).then(function(data) {
            return data.permission;
        });
    }, function() {
        return github.put('/repos/:owner/:repo/collaborators/:username', { permission: "pull" }, { username: handle }).then(function() {
            return "read";
        });
    });
}

