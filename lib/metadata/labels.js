"use strict";
var minimatch = require('minimatch');

// As of 2018-07-26, GitHub.com restricts the total number of pull request
// labels to 100.
var MAX_LABELS = 100;
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
    "fetch": ["cors/**"],
    "xhr": ["XMLHttpRequest/**"],

    "assets": ["fonts/**", "images/**", "media/**", "common/**"],
    "css": ["css/tools/**"],
    "html": ["rtl-reference.html", "rtl-test.html"],
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
    "GitHub Actions": [".github/**"],
    "Taskcluster": [".taskcluster.yml"]
};
var LABEL_TO_REGEXPS = Object.create(null);
var toPathRegExp = function(pattern) { return minimatch.makeRe(pattern); };

for (var key in LABEL_TO_PATTERNS) {
    LABEL_TO_REGEXPS[key] = LABEL_TO_PATTERNS[key]
        .map(toPathRegExp);
}

function fromFile(filename) {
    var matches = function(regexp) { return regexp.test(filename); };
    var labels = [];
    var label;

    for (label in LABEL_TO_REGEXPS) {
        if (LABEL_TO_REGEXPS[label].some(matches)) {
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
        .reduce(function(all, some) { return all.concat(some); }, [])
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
    return workingGroups.map(function(shortname) { return "wg-" + shortname; });
};

/**
 * Combine multiple arrays of labels into a single array, honoring limitations
 * of the target platform.
 *
 * @param {...Array<string>} labels - any number of arrays of labels
 *
 * @returns {Array<string>}
 */
exports.merge = function() {
    var all = [];
    var length = arguments.length;
    var index;

    for (index = 0; index < length; index += 1) {
        all.push.apply(all, arguments[index]);
    }

    if (all.length > MAX_LABELS) {
        all.length = 0;
        all.push("infra", "very-large");
    }

    return all;
};
