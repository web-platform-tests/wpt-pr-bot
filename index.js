"use strict";
var t0 = Date.now();

var express = require("express"),
    bl = require("bl"),
    labelModel = require('./lib/label-model'),
    metadata = require('./lib/metadata'),
    comment = require('./lib/comment'),
    rmReviewable = require('./lib/rm-reviewable'),
    github = require('./lib/github'),
    checkRequest = require('./lib/check-request'),
    isProcessed = require('./lib/is-processed');


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

function removeReviewableBanner(n, metadata) {
    return rmReviewable(n, metadata).then(
        funkLogMsg(n, "Removed Reviewable banner."),
        funkLogErr(n, "Error when attempting to remove Reviewable banner.")
    );
}

app.post('/github-hook', function (req, res, next) {
	req.pipe(bl(function (err, body) {
    	if (err) {
        	logArgs(err.message);
		} else if (process.env.NODE_ENV != 'production' || checkRequest(body, req.headers["x-hub-signature"], process.env.GITHUB_SECRET)) {
		    res.send(new Date().toISOString());
            
            // FILTER ALL THE THINGS
            try {
    	        body = JSON.parse(body);
            } catch(e) {
                return;
            }
            if (!body) return;
            if (body.sender && body.sender.login == "wpt-pr-bot") return;
            if (!body.pull_request) return;
            if (body.pull_request.merged) return;
            // END FILTERNG //
            
            var action = body.action;
            var n = body.pull_request.number;
            var u = (body.pull_request.user && body.pull_request.user.login) || null;
            var content = body.pull_request.body || "";
            
            
            if (!body.comment && action == "edited") {
                logArgs("#" + n, "pull request edited");
	            metadata(n, u, content).then(function(metadata) {
                    return removeReviewableBanner(n, metadata);
                });
            } else if (action == "opened" || action == "synchronize" || (body.comment && action == "created")) {
                metadata(n, u, content).then(function(metadata) {
                    logArgs(metadata);
                    return labelModel.post(number, metadata.labels).then(
                        funkLogMsg(n, "Added missing LABELS if any."),
                        funkLogErr(n, "Something went wrong while adding missing LABELS.")
                    ).then(function() {
                        return comment(n, metadata);
                    }).then(
                        funkLogMsg(n, "Added missing REVIEWERS if any."),
                        funkLogErr(n, "Something went wrong while adding missing REVIEWERS.")
                    ).then(function() {
                        return removeReviewableBanner(n, metadata);
                    })
                }).catch(funkLogErr(n, "THIS SHOULDN'T EVER HAPPEN"));
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
});
