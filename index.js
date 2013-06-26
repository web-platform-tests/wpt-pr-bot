var t0 = Date.now();

var express = require("express"),
    label = require('./lib/label');

var app = module.exports = express();

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
    if (body && body.pull_request) {
        if (body.action == "opened" || body.action == "synchronize") {
            label.setLabelsOnIssue(body.number, function(err) {
                if (err) return console.log(err);
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
