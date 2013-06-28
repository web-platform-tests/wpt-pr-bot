var email = require('./email'),
    github = require('./github'),
    funk = require('./funk'),
    handlebars = require('handlebars');
    
var MAILING_LIST = "public-web-platform-tests-notifications@w3.org",
    SENDER_EMAIL = "web-platform-tests-notifications@w3.org";

var subjectTemplate = handlebars.compile("{{#each labels}}[{{ this }}]{{/each}} {{ subject }} (#{{ number }})"),
    fromTemplate = handlebars.compile("{{ name }} <{{email}}>"),
    bodyTemplate = handlebars.compile("{{ body }}\n\nView on GitHub: {{ link }}"),
    prClosedTemplate = handlebars.compile("Closed pull request #{{ number }}.\n\nView on GitHub: {{ link }}"),
    prMergedTemplate = handlebars.compile("Merged pull request #{{ number }}.\n\nView on GitHub: {{ link }}"),
    prSynchronizeTemplate = handlebars.compile("Updated pull request #{{ number }}.\n\nView on GitHub: {{ link }}"),
    prReopenedTemplate = handlebars.compile("Reopened pull request #{{ number }}.\n\nView on GitHub: {{ link }}");

exports.notifyPullRequest = notifyPullRequest;
function notifyPullRequest(data, callback) {
    github.get(data.pull_request.user.url, function(err, user) {
        if (err) return callback(err)
        var context = {
            body: data.pull_request.body,
            subject: data.pull_request.title,
            name: user.name || user.login,
            link: data.pull_request.html_url,
            number: data.number,
            labels: data.labels.sort(),
            email: SENDER_EMAIL
        };
        var body;
        switch (data.action) {
            case "opened":
                body = bodyTemplate(context);
                break;
            case "closed":
                if (body.pull_request.merged) {
                    body = prMergedTemplate(context);
                } else {
                    body = prClosedTemplate(context);
                }
                break;
            case "synchronize":
                body = prSynchronizeTemplate(context);
            case "reopened":
                body = prReopenedTemplate(context);
        }
        
        email.sendMessage({
            to: [MAILING_LIST],
            body: body,
            subject: subjectTemplate(context),
            from: fromTemplate(context)
        }, callback);
    });
}

exports.notifyComment = notifyComment;
function notifyComment(data, callback) {
    console.log(JSON.stringify(data, null, 4))
    github.get(data.comment.user.url, function(err, user) {
        if (err) return callback(err)
        github.get(data.comment.issue_url, function(err, issue) {
            if (err) return callback(err)
            var context = {
                body: data.comment.body,
                subject: issue.title,
                name: user.name || user.login,
                link: data.comment.html_url,
                number: issue.number,
                labels: issue.labels.map(funk.prop('name')).sort(),
                email: SENDER_EMAIL
            };
            email.sendMessage({
                to: [MAILING_LIST],
                body: bodyTemplate(context),
                subject: subjectTemplate(context),
                from: fromTemplate(context)
            }, callback);
        });
    });
}


