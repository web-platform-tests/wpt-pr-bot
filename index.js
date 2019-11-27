"use strict";
var t0 = Date.now();

var express = require("express"),
    bl = require("bl"),
    labelModel = require('./lib/label-model'),
    metadata = require('./lib/metadata'),
    comment = require('./lib/comment'),
    github = require('./lib/github'),
    checkRequest = require('./lib/check-request'),
    filter = require('./lib/filter'),
    q = require('q'),
    flags = require('flags'),
    fs = require('fs');

flags.defineBoolean('dry-run', false, 'Run in dry-run mode (no POSTs to GitHub)');
flags.parse();

function promise(value) {
    var deferred = q.defer();
    deferred.resolve(value);
    return deferred.promise;
}

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

function getPullRequest(n, body) {
    if (body.pull_request) {
        return promise(body.pull_request);
    }
    return github.get("/repos/:owner/:repo/pulls/:number", { number: n });
}

// Load the secrets in.
let secrets;
try {
    fs.accessSync('secrets.json', fs.constants.R_OK);
    secrets = JSON.parse(fs.readFileSync('secrets.json', 'utf-8'));
} catch (err) {
    // Fallback to using env.
    secrets = {
        githubToken: process.env.GITHUB_TOKEN,
        webhookSecret: process.env.GITHUB_SECRET,
    };
}
github.setToken(secrets.githubToken);

var currentlyRunning = {};

app.post('/github-hook', function (req, res) {
    req.pipe(bl(function (err, body) {
        if (err) {
            logArgs(err.message);
        } else if (process.env.NODE_ENV != 'production' || checkRequest(body, req.headers["x-hub-signature"], secrets.githubToken)) {
            res.send(new Date().toISOString());

            // FILTER ALL THE THINGS
            try {
                body = JSON.parse(body);
            } catch(e) {
                return;
            }
            if (!filter.event(body, logArgs)) {
                return;
            }
            if (!body.pull_request && (body.issue && !body.issue.pull_request)) {
                logArgs("Ignoring event: not a pull request");
                return;
            }
            if (body.pull_request && !filter.pullRequest(body.pull_request, logArgs)) {
                return;
            }
            // Note: `filter.pullRequest` is checked again after a timeout.
            // END FILTERNG //

            var action = body.action;
            var isComment = !!body.comment;
            var issue = body.pull_request || body.issue;
            var n = issue.number;
            var u = (issue.user && issue.user.login) || null;
            var content = issue.body || "";
            if (action == "opened" || action == "synchronize" ||
                action == "ready_for_review" ||
                (isComment && action == "created")) {
                if (n in currentlyRunning) {
                    logArgs("#" + n + " is already being processed.");
                    return;
                }
                currentlyRunning[n] = true;
                logArgs("#" + n, isComment ? "comment" : "pull request", action);

                waitFor(5 * 1000).then(function() { // Avoid race condition
                    return getPullRequest(n, body);
                }).then(function(pull_request) {
                    if (!filter.pullRequest(pull_request, logArgs)) {
                        return;
                    }
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
                logArgs("#" + n + ": not handled.", "action:", action, "isComment:", isComment);
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
