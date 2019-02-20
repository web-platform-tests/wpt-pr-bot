"use strict";
var minimatch = require('minimatch');

var LABEL_FROM_SUBDIRECTORY = minimatch.makeRe("@(css|tools)/**");
var PRUNE_LABELS = ["tools"];
var LABEL_TO_PATTERNS = {
    // These labels exist to properly categorize changes to files located in
    // directories that have been relocated.
    "2dcontext": ["canvas2d/**"],
    "WebCryptoAPI": ["crypto-api/**"],
    "CSP": ["csp/**"],
    "dom": ["DOMCore/**"],
    "page-visibility": ["pagevisibility/**"],
    "pointerevents": ["PointerEvents/**"],
    "progress-events": ["ProgressEvents/**"],
    "selectors-api": ["SelectorsAPI/**"],
    "eventsource": ["ServerSentEvents/**"],
    "shadow-dom": ["ShadowDOM/**"],
    "webmessaging": ["WebMessaging/**"],
    "websockets": ["WebSockets/**"],
    "webstorage": ["WebStorage/**"],
    "workers": ["Workers/**"],
    "html-imports": ["imports/**"],
    "html-fieldset": [
        "html/rendering/non-replaced-elements/the-fieldset-and-legend-elements/**",
        "html/semantics/forms/the-fieldset-element/**",
        "html/semantics/forms/the-legend-element/**"
    ],
    "html": ["rtl-reference.html/**"],
    "html": ["rtl-test.html/**"],
    "fetch": ["cors/**"],
    "xhr": ["XMLHttpRequest/**"],

    "assets": ["fonts/**", "images/**", "media/**", "common/**"],
    "css": ["css/tools/**"],
    "idlharness.js": ["resources/idlharness.*", "resources/webidl2/**"],
    "infra": [
        "css/tools/**",
        "examples/**",
        "harness/**",
        "infrastructure/**",
        "LICENSE",
        "reporting/**",
        "resources/**",
        "tools/**"
    ],
    "testdriver.js": ["resources/testdriver*"],
    "testharness.js": ["resources/testharness*", "resources/test/**"],
    "Azure Pipelines": [".azure-pipelines.yml", "tools/ci/azure/**"],
    "Taskcluster": [".taskcluster.yml"],
    "Travis CI": [".travis.yml"]
};
var LABEL_TO_REGEXPS = Object.create(null);

for (var key in LABEL_TO_PATTERNS) {
    LABEL_TO_REGEXPS[key] = LABEL_TO_PATTERNS[key]
        .map(function(pattern) { return minimatch.makeRe(pattern); });
}

function fromFile(filename) {
    var labels = [];
    var matches, label;

    for (label in LABEL_TO_REGEXPS) {
        matches = LABEL_TO_REGEXPS[label]
            .some(function(regexp) { return regexp.test(filename); });

        if (matches) {
            labels.push(label);
        }
    }

    if (LABEL_FROM_SUBDIRECTORY.test(filename)) {
        labels.push(filename.split("/")[1]);
    }

    if (!labels.length) {
        if (filename.indexOf("/") > -1) {
            labels.push(filename.split("/")[0]);
        } else if (filename) {
            labels.push("infra");
        }
    }

    return labels.filter(function(label) {
        return PRUNE_LABELS.indexOf(label) === -1;
    });
}

/**
 * Derive a list of GitHub issue tags from a lists of modified file names in
 * web-platform-tests.
 *
 * @param {Array<string>}
 *
 * @returns {Array<string>}
 */
exports.fromFiles = function(filenames) {
    return filenames
        .map(function(filename) { return fromFile(filename); })
        // flatten
        .reduce(function(all, some) { return all.concat(some); })
        // remove duplicates
        .filter(function(label, index, labels) {
            return labels.indexOf(label) === index;
        });
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
