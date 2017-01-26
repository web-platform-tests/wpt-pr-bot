"use strict";

var path = require("path");
var EXTENSION_WHITELIST = [
    ".bmp",
    ".css",
    ".dat",
    ".dtd",
    ".frag",
    ".gif",
    ".htm",
    ".html",
    ".ico",
    ".idl",
    ".jpg",
    ".js",
    ".json",
    ".manifest",
    ".mp3",
    ".mp4",
    ".oga",
    ".ogv",
    ".pem",
    ".png",
    ".svg",
    ".swf",
    ".template",
    ".ttf",
    ".txt",
    ".vert",
    ".vtt",
    ".wav",
    ".webm",
    ".widl",
    ".widlprocxml",
    ".woff",
    ".xht",
    ".xhtml",
    ".xml",
    ".xsl",
    ".yaml",
    ".yml"
];

function getLowerCasedExtension(f) {
    return path.extname(f).toLowerCase();
}


function isUnsafeExtension(ext) {
    return EXTENSION_WHITELIST.indexOf(ext) < 0;
}


module.exports = function isSafe(filenames) {
    return filenames.map(getLowerCasedExtension).filter(isUnsafeExtension).length == 0;
};

