var github = require('./github'),
    funk = require('./funk');
    
var LEGACY_NAMES = {
    "canvas2d": "2dcontext",
    "crypto-api": "WebCryptoAPI",
    "DOMCore": "dom",
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
function setLabelsOnIssues(state, cb) {
    if (state != "closed") state = "open";
    github.get("/repos/:owner/:repo/pulls?state=:state", { state: state }, function(err, body) {
        function run(pulls, callback) {
            if (pulls.length == 0) return callback(null, "done!")
            var num = pulls.pop().number;
            getDirs(num, function(err, dirs) {
                if (err) return callback(err);
                setLabels(num, dirs, function(err) {
                    if (err) return callback(err);
                    console.log(num, arguments);
                    run(pulls, callback);
                });
            });
        }
        run(body,cb);
    });
}

exports.setLabelsOnIssue = setLabelsOnIssue;
function setLabelsOnIssue(issue, cb) {
    getDirs(issue, function(err, dirs) {
        if (err) return cb(err);
        setLabels(issue, dirs, cb);
    });
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
function getDirs(issue, callback) {
    github.get("/repos/:owner/:repo/pulls/:number/files", { number: issue }, function(err, body) {
        if (err) return callback(err);
        var dirs = _unique(body.map(funk.compose(_legacyNames, _getRootDir, funk.prop('filename'))));
        callback(null, dirs);
    });
}

exports.setLabels = setLabels;
function setLabels(issue, labels, callback) {
    github.post('/repos/:owner/:repo/issues/:number/labels', labels, { number: issue }, function(err, labels) {
        if (err) callback(err);
        else callback(null, labels.map(funk.prop('name')));
    });
}

exports.getLabels = getLabels;
function getLabels(issue, callback) {
    github.get('/repos/:owner/:repo/issues/:number/labels', { number: issue }, function(err, labels) {
        if (err) callback(err);
        else callback(null, labels.map(funk.prop('name')));
    });
}

var _isDir = funk.compose(funk.curry(funk.equal, 'dir'), funk.prop('type'));
exports.getLabelNames = getLabelNames;
function getLabelNames(callback) {
    github.get("/repos/:owner/:repo/contents/", function(err, body) {
        if (err) return callback(err);
        callback(null, body.filter(_isDir).map(funk.prop('name')));
    });
}

if (require.main === module) {
    setLabelsOnIssues("open", console.log);
}
