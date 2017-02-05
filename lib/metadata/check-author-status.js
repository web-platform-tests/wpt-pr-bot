"use strict";

var github = require("../github");
var funk = require("../funk");

module.exports = function checkAuthorStatus(author) {
    return github.get("/repos/:owner/:repo/collaborators").then(function(collaborators) {
        return collaborators.map(funk.prop("login")).some(function(login) {
            return login == author;
        });
    });
};

