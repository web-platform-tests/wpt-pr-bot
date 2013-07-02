"use strict";
var github = require('./lib/github');

if (process.env.GITHUB_SECRET) {
    github.post('/repos/:owner/:repo/hooks', {
        "name": "web",
        "active": true,
        "events": [
           "pull_request",
           "issues",
           "issue_comment",
           "pull_request_review_comment"
        ],
        "config": {
            "url": "http://ganesh.jit.su/github-hook",
            "content_type": "json",
            "secret": process.env.GITHUB_SECRET
        }
    }).then(console.log).fail(console.log);
} else {
    console.log("You must provide a GITHUB_SECRET env variable to set GitHub hooks.");
    github.get('/repos/:owner/:repo/hooks').then(console.log).catch(console.log);
}



