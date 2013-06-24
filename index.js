var t0 = Date.now();

var express = require("express"),
    label = require('./lib/label');

var app = module.exports = express();

// Configuration
app.configure(function(){
    app.use(express.bodyParser());
    app.use(app.router);
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

app.post('/', function (req, res, next) {
    console.log(req)
});

var port = process.env.PORT || 5000;
app.listen(port, function () {
    console.log("Express server listening on port %d in %s mode", port, app.settings.env);
    console.log("App started in", (Date.now() - t0) + "ms.");
});
