var t0 = Date.now();

var express = require("express"),
    label = require('./lib/label'),
    notify = require('./lib/notify');

var app = module.exports = express();

function logArgs() {
    var output = [new Date().toISOString()];
    for (var i = 0; i < arguments.length; i++) {
        output.push(JSON.stringify(arguments[i]));
    }
    process.nextTick(function() {
        console.log(output.join(' '));
    });
}

function requestComesFromGitHub(req) {
    var crypto = require('crypto');
    var hash = crypto.createHmac('sha1', process.env.GITHUB_SECRET).update(req.body).digest('hex');
    var hubSig = (req.headers["x-hub-signature"] || '').replace('sha1=', '');
    return hash === hubSig;
}

// Configuration
app.configure(function(){
    app.use(function(req, res, next) {
        var data = '';
        req.setEncoding('utf8');
        req.on('data', function(chunk) {
           data += chunk;
        });

        req.on('end', function() {
            req.body = data;
            next();
        });
    });
    app.use(app.router);
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

app.post('/github-hook-pull-requests', function (req, res, next) {
    var body = JSON.parse(req.body);
    logArgs("requestComesFromGitHub", requestComesFromGitHub(req));
    if (body && body.pull_request) {
        if (body.action == "opened" || body.action == "synchronize" || body.action == "reopened") {
            label.setLabelsOnIssue(body.number, function(err, labels) {
                if (err) return logArgs(err);
                body.labels = labels;
                notify.notifyPullRequest(body, logArgs);
            });
        } else {
            label.getLabels(body.number, function(err, labels) {
                if (err) return logArgs(err);
                body.labels = labels;
                notify.notifyPullRequest(body, logArgs);
            });
        }
    }
    res.send('');
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Express server listening on port %d in %s mode", port, app.settings.env);
    console.log("App started in", (Date.now() - t0) + "ms.");
});
