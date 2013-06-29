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
    prReopenedTemplate = handlebars.compile("Reopened pull request #{{ number }}.\n\nView on GitHub: {{ link }}"),
    messageIdTemplate = handlebars.compile("<web-platform-tests_issue_{{ number }}@w3.org>"),
    messageIdTimestampTemplate = handlebars.compile("<web-platform-tests_issue_{{ number }}_{{ timestamp }}@w3.org>");

function suffix(suffix) {
    return function(str) {
        return str + suffix;
    }
}

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
            email: SENDER_EMAIL,
            timestamp: Date.now()
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

        var messageId, inReplyTo;
        if (data.action == "opened") {
            messageId = messageIdTemplate(context);
            inReplyTo = null;
        } else {
            messageId = messageIdTimestampTemplate(context);
            inReplyTo = messageIdTemplate(context);
        }

        email.sendMessage({
            messageId: messageId,
            inReplyTo: inReplyTo,
            references: inReplyTo,
            to: [MAILING_LIST],
            body: body,
            subject: subjectTemplate(context),
            from: fromTemplate(context)
        }, callback);
    });
}

exports.notifyComment = notifyComment;
function notifyComment(data, callback) {
    github.get(data.comment.user.url, function(err, user) {
        if (err) return callback(err);
        // The below's a shortcut based on the shared id between PR and issues. Hacky.
        var url = data.comment.issue_url || data.comment.pull_request_url.replace("/pulls/", "/issues/");
        github.get(url, function(err, issue) {
            if (err) return callback(err);
            var context = {
                body: data.comment.body,
                subject: issue.title,
                name: user.name || user.login,
                link: data.comment.html_url,
                number: issue.number,
                labels: issue.labels.map(funk.prop('name')).sort(),
                email: SENDER_EMAIL,
                timestamp: Date.now()
            };
            var inReplyTo = messageIdTemplate(context);

            email.sendMessage({
                messageId: messageIdTimestampTemplate(context),
                inReplyTo: inReplyTo,
                references: inReplyTo,
                to: [MAILING_LIST],
                body: bodyTemplate(context),
                subject: subjectTemplate(context),
                from: fromTemplate(context)
            }, callback);
        });
    });
}


