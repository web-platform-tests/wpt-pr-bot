"use strict";
var github = require('./github'),
    funk = require('./funk'),
    uniq = require('./uniq'),
	q = require('q');
    
var LEGACY_NAMES = {
    "canvas2d": "2dcontext",
    "crypto-api": "WebCryptoAPI",
    "csp": "CSP",
    "DOMCore": "dom",
    "pagevisibility": "page-visibility",
    "PointerEvents": "pointerevents",
    "ProgressEvents": "progress-events",
    "SelectorsAPI": "selectors-api",
    "ServerSentEvents": "eventsource",
    "ShadowDOM": "shadow-dom",
    "WebMessaging": "webmessaging",
    "WebSockets": "websockets",
    "WebStorage": "webstorage",
    "Workers": "workers",
    "imports": "html-imports",
	"rtl-reference.html": "html",
	"rtl-test.html": "html"
};

var LABEL_TO_FILENAMES = {
    "assets": ["fonts", "images", "media", "common"],
    "infra": [
        ".gitignore",
        ".gitmodules",
        ".htaccess",
        "CONTRIBUTING.md",
        "examples",
        "harness",
        "LICENSE",
        "README.md",
        "reporting",
        "resources",
        "tools",
        "tr-mappings.json",
        "config.json",
        "config.default.json",
        "serve.py",
        "server-side.md"
    ],
    "old-tests": ["old-tests"]
};
exports.LABEL_TO_FILENAMES = LABEL_TO_FILENAMES; // TODO avoid exporting this.

function _getRootDir(url) {
    return url.split('/')[0]
}

function _legacyNames(k) {
    return LEGACY_NAMES[k] || k;
}

function _specialLabels(dirname) {
    for (var label in LABEL_TO_FILENAMES) {
        if (LABEL_TO_FILENAMES[label].indexOf(dirname) > -1) {
            return label;
        }
    }
    return dirname;
}

exports.fromIssue = fromIssue;
function fromIssue(issue) {
    return github.get("/repos/:owner/:repo/pulls/:number/files", { number: issue })
		.then(getLabelsFromFiles);
}

exports.fromFiles = fromFiles;
function fromFiles(files) {
    return uniq(files.map(funk.compose(_specialLabels, _legacyNames, _getRootDir, funk.prop('filename'))));
}

