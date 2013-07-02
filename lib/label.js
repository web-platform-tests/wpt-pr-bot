"use strict";
var github = require('./github'),
    funk = require('./funk'),
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
    "Workers": "workers"
};

exports.setLabelsOnIssues = setLabelsOnIssues;
function setLabelsOnIssues(state) {
    if (state != "closed") state = "open";
    return github.get("/repos/:owner/:repo/pulls?state=:state", { state: state }).then(function(pull_requests) {
        var promises = pull_requests.map(funk.compose(setLabelsOnIssue, funk.prop('number')));
        return q.all(promises);
    });
}

exports.setLabelsOnIssue = setLabelsOnIssue;
function setLabelsOnIssue(issue) {
    return getDirs(issue).then(funk.curry(setLabels, issue));
}

function _getRootDir(url) {
    return url.split('/')[0]
}

function _legacyNames(k) {
    return LEGACY_NAMES[k] || k;
}

function _unique(array) {
    var output = []
    array.forEach(function(item) {
        if (output.indexOf(item) < 0) {
            output.push(item);
        }
    });
    return output;
}

exports.getDirs = getDirs;
function getDirs(issue) {
    return github.get("/repos/:owner/:repo/pulls/:number/files", { number: issue }).then(function(files) {
        return _unique(files.map(funk.compose(_legacyNames, _getRootDir, funk.prop('filename'))));
    });
}

exports.setLabels = setLabels;
function setLabels(issue, labels) {
    return github.post('/repos/:owner/:repo/issues/:number/labels', labels, { number: issue }).then(function(labels) {
        return labels.map(funk.prop('name'));
    });
}

exports.getLabels = getLabels;
function getLabels(issue) {
    return github.get('/repos/:owner/:repo/issues/:number/labels', { number: issue }).then(function(labels) {
        return labels.map(funk.prop('name'));
    });
}

var _isDir = funk.compose(funk.curry(funk.equal, 'dir'), funk.prop('type'));
exports.getLabelNames = getLabelNames;
function getLabelNames() {
    return github.get("/repos/:owner/:repo/contents/").then(function(body) {
        return body.filter(_isDir).map(funk.prop('name'));
    });
}

if (require.main === module) {
    setLabelsOnIssues("open").then(console.log).fail(console.log);
}
