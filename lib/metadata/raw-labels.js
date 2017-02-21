"use strict";
var funk = require('../funk'),
	uniq = require('../uniq');
    
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
	"rtl-test.html": "html",
	"cors": "fetch",
    "XMLHttpRequest": "xhr"
};

var LABEL_TO_FILENAMES = {
    "assets": ["fonts", "images", "media", "common"],
    "infra": [
        "examples",
        "harness",
        "LICENSE",
        "reporting",
        "resources",
        "tools"
    ],
    "old-tests": ["old-tests"]
};

var SUB_DIRECTORIES = ["css"];
var SUB_DIRECTORIES_REGEXP = new RegExp("^(?:" + SUB_DIRECTORIES.join("|") + ")/");

function _subDirs(url) {
    return url.replace(SUB_DIRECTORIES_REGEXP, "");
}

function _getRootDir(url) {
    return url.split('/')[0];
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

function _rootFileToInfra(dirname) {
    return dirname.indexOf(".") > -1 ? "infra" : dirname;
}

function _notEmptyString(str) {
    return str != "";
}

var _pathToLabel = funk.compose(_rootFileToInfra, _specialLabels, _legacyNames, _getRootDir, _subDirs);

module.exports = function(filenames) {
    return uniq(filenames.map(_pathToLabel).filter(_notEmptyString));
};

