"use strict";

var path = require("path");

var TEST_EXTENSIONS = [".html", ".htm"];

function isTestPage(f) {
    return TEST_EXTENSIONS.indexOf(path.extname(f).toLowerCase()) > -1;
}


function isUnsafeExtension(ext) {
    return EXTENSION_WHITELIST.indexOf(ext) < 0;
}


module.exports = function testUrls(issueNumber, filenames, paths) {
    var output = filenames.filter(isTestPage).map(function(p) {
        return "https://w3c-test.org/submissions/" + issueNumber + "/" + p;
    });
    
    if (output.length) {
        return output;
    }
    
    return paths.filter(function(p) { return p; }).map(function(p) {
        return "https://w3c-test.org/submissions/" + issueNumber + "/" + p + "/"; 
    });
};

