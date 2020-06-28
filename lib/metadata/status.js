"use strict";

var github = require("../github");

module.exports = async function(arg) {
    return typeof arg == "string" ? _status(arg) : _statuses(arg);
};

async function _statuses(handles) {
    handles = handles.slice(0);
    // Reversing the array here keeps compatibility with a previous version of
    // this code, which used a recursive structure and called pop() on the
    // array each time. This could likely be removed with some investigation.
    handles.reverse();
    var output = [];
    for (const handle of handles) {
        const permission = await _status(handle);
        output.push({ login: handle, permission: permission });
    }
    return output;
}

async function _status(handle) {
    return github.get("/repos/:owner/:repo/collaborators/:username", { username: handle }).then(function() {
        return github.get("/repos/:owner/:repo/collaborators/:username/permission", { username: handle }).then(function(data) {
            return data.permission;
        });
    }, function() {
        return "none";
    });
}
