var github = require('./lib/github');

var hooks = [{
    "name": "web",
    "active": true,
    "events": [
       "pull_request",
       "pull_request_review_comment"
    ],
    "config": {
        "url": "http://ganesh.jit.su/github-hook-pull-requests",
        "content_type": "json",
        "secret": process.env.GITHUB_SECRET
    }
}];
function setHooks(hooks, callback) {
    if (!hooks.length) return callback(null, "Done!");
    github.post('/repos/:owner/:repo/hooks', hooks.pop(), function(err, data) {
        if (err) return callback(err);
        callback(null, data);
        setHooks(hooks, callback);
    });
}

if (process.env.GITHUB_SECRET) {
    setHooks(hooks, console.log)
} else {
    console.log("You must provide a GITHUB_SECRET env variable to set GitHub hooks.")
    github.get('/repos/:owner/:repo/hooks', console.log);
}



