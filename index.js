"use strict";
var t0 = Date.now();

var express = require("express"),
    bl = require("bl"),
    label = require('./lib/label'),
    label = require('./lib/label-model'),
    notify = require('./lib/notify'),
    checkRequest = require('./lib/check-request');

var app = module.exports = express();

function logArgs() {
    var args = arguments;
    process.nextTick(function() {
        console.log.apply(console, args);
    });
}

app.post('/github-hook', function (req, res, next) {
	req.pipe(bl(function (err, body) {
    	if (err) {
        	logArgs(err.message);
		} else if (process.env.NODE_ENV != 'production' || checkRequest(body, req.headers["x-hub-signature"], process.env.GITHUB_SECRET)) {
		    res.send(new Date().toISOString());
	        body = JSON.parse(body);
	        if (body && body.pull_request) {
	            if (body.action == "opened" || body.action == "synchronize") {
	                label.setLabelsOnIssue(body.number).then(function(labels) {
	                    body.labels = labels;
	                    return notify.notifyPullRequest(body);
	                }).then(logArgs).catch(logArgs);
	            } else {
	                labelModel.get(body.number).then(function(labels) {
	                    body.labels = labels;
	                    return notify.notifyPullRequest(body);
	                }).then(logArgs).catch(logArgs);
	            }
	        } else if (body && body.comment) {
	            notify.notifyComment(body).then(logArgs).catch(logArgs);
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
