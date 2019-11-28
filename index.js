// istanbul ignore file

"use strict";

var t0 = Date.now();

var express = require("express"),
    bl = require("bl"),
    labelModel = require('./lib/label-model'),
    github = require('./lib/github'),
    metadata = require('./lib/metadata'),
    comment = require('./lib/comment'),
    checkRequest = require('./lib/check-request'),
    filter = require('./lib/filter'),
    q = require('q'),
    flags = require('flags');

flags.defineBoolean('dry-run', false, 'Run in dry-run mode (no POSTs to GitHub)');
flags.parse();

function waitFor(ms) {
    var deferred = q.defer();
    setTimeout(function() { deferred.resolve(); }, ms);
    return deferred.promise;
}

var app = module.exports = express();

function logArgs() {
    var args = arguments;
    process.nextTick(function() {
        console.log.apply(console, args);
    });
}

function funkLogMsg(num, msg) {
    return function() { logArgs("#" + num + ": " + msg); };
}

function funkLogErr(num, msg) {
    return function(err) { logArgs("#" + num + ": " + msg + "\n", err); };
}

// Load the secrets in.
let secrets;
try {
    secrets = require('./secrets.json');
} catch (err) {
    console.log(`Unable to load secrets.json, falling back to env (error: ${err})`);
    secrets = {
        githubToken: process.env.GITHUB_TOKEN,
        webhookSecret: process.env.GITHUB_SECRET,
    };
}
// TODO(stephenmcgruer): Refactor code to avoid awkward global setter.
github.setToken(secrets.githubToken);

var currentlyRunning = {};

app.post('/github-hook', function (req, res) {
    req.pipe(bl(function (err, body) {
        if (err) {
            logArgs(err.message);
        } else if (process.env.NODE_ENV != 'production' || checkRequest(body, req.headers["x-hub-signature"], secrets.webhookSecret)) {
            res.send(new Date().toISOString());

            try {
                body = JSON.parse(body);
            } catch(e) {
                return;
            }
            if (!filter.event(body, logArgs)) {
                return;
            }
            if (!filter.pullRequest(body.pull_request, logArgs)) {
                return;
            }

            var action = body.action;
            var pr = body.pull_request;
            var n = pr.number;
            var u = (pr.user && pr.user.login) || null;
            var content = pr.body || "";
            if (action == "opened" || action == "synchronize" ||
                action == "ready_for_review") {
                if (n in currentlyRunning) {
                    logArgs("#" + n + " is already being processed.");
                    return;
                }
                currentlyRunning[n] = true;
                logArgs("#" + n, action);

                waitFor(5 * 1000).then(function() { // Avoid race condition
                    return metadata(n, u, content).then(function(metadata) {
                        logArgs(metadata);
                        return labelModel.post(n, metadata.labels, flags.get('dry-run')).then(
                            funkLogMsg(n, "Added missing LABELS if any."),
                            funkLogErr(n, "Something went wrong while adding missing LABELS.")
                        ).then(function() {
                            return comment(n, metadata, flags.get('dry-run'));
                        }).then(
                            funkLogMsg(n, "Added missing REVIEWERS if any."),
                            funkLogErr(n, "Something went wrong while adding missing REVIEWERS.")
                        );
                    });
                }).then(function() {
                    delete currentlyRunning[n];
                }, function(err) {
                    delete currentlyRunning[n];
                    funkLogErr(n, "THIS SHOULDN'T EVER HAPPEN")(err);
                });
            } else {
                logArgs("#" + n + ": not handled.", "action:", action);
            }
        } else {
            logArgs("Unverified request", req);
        }
    }));
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Express server listening on port %d in %s mode", port, app.settings.env);
    console.log("App started in", (Date.now() - t0) + "ms.");
    if (flags.get('dry-run'))
        console.log('Starting in DRY-RUN mode');
});
