"use strict";
var funk = require('../funk'),
    uniq = require('../uniq');

var LABEL_TO_FILENAMES = {
    // These labels exist to properly categorize changes to files located in
    // directories that have been relocated.
    "2dcontext": ["canvas2d"],
    "WebCryptoAPI": ["crypto-api"],
    "CSP": ["csp"],
    "dom": ["DOMCore"],
    "page-visibility": ["pagevisibility"],
    "pointerevents": ["PointerEvents"],
    "progress-events": ["ProgressEvents"],
    "selectors-api": ["SelectorsAPI"],
    "eventsource": ["ServerSentEvents"],
    "shadow-dom": ["ShadowDOM"],
    "webmessaging": ["WebMessaging"],
    "websockets": ["WebSockets"],
    "webstorage": ["WebStorage"],
    "workers": ["Workers"],
    "html-imports": ["imports"],
    "html": ["rtl-reference.html"],
    "html": ["rtl-test.html"],
    "fetch": ["cors"],
    "xhr": ["XMLHttpRequest"],

    "assets": ["fonts", "images", "media", "common"],
    "infra": [
        "examples",
        "harness",
        "infrastructure",
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

var _pathToLabel = funk.compose(_rootFileToInfra, _specialLabels, _getRootDir, _subDirs);

/**
 * Derive a list of GitHub issue tags from a lists of modified file names in
 * web-platform-tests.
 *
 * @param {Array<string>}
 *
 * @returns {Array<string>}
 */
exports.fromFiles = function(filenames) {
    return uniq(filenames.map(_pathToLabel).filter(_notEmptyString));
};

/**
 * Derive a list of GitHub issue tags from a list of working group names.
 *
 * @param {Array<string>} workingGroups
 *
 * @returns {Array<string>}
 */
exports.fromWorkingGroups = function labels(workingGroups) {
    return workingGroups.map(function(shortname) { return "wg-" + shortname; })
};
