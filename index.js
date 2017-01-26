"use strict";
var t0 = Date.now();

var express = require("express"),
    bl = require("bl"),
    labelModel = require('./lib/label-model'),
    metadata = require('./lib/metadata'),
    notify = require('./lib/notify'),
    comment = require('./lib/comment'),
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
				console.log(body.number, body.action)
	            if (body.action == "opened" || body.action == "synchronize") {
	                metadata(body.number).then(function(metadata) {
						logArgs(metadata);
						return labelModel.post(body.number, metadata.labels).then(function() {
							if (body.action == "opened") {
								return comment(body.number, metadata).then(function(comment) {
									logArgs(comment);
									return notify.notifyPullRequest(body, metadata);
								});
							}
							return notify.notifyPullRequest(body, metadata);
						});
					}).then(logArgs).catch(logArgs);
	            } else {
	                metadata(body.number).then(function(metadata) {
						logArgs(metadata);
						return notify.notifyPullRequest(body, metadata);
					}).then(logArgs).catch(logArgs);
	            }
	        } else if (body && body.comment && (body.issue || body.pull_request)) {
                metadata((body.issue || body.pull_request).number).then(function(metadata) {
					logArgs(metadata);
					return notify.notifyComment(body, metadata);
				}).then(logArgs).catch(logArgs);
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
