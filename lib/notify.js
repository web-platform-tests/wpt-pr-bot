"use strict";
var email = require('./email'),
    github = require('./github'),
    funk = require('./funk'),
    handlebars = require('handlebars');
    
var MAILING_LIST,
    SENDER_EMAIL = "web-platform-tests-notifications@w3.org";

if (process.env.NODE_ENV == 'production') {
    MAILING_LIST = "public-web-platform-tests-notifications@w3.org";
} else {
    MAILING_LIST = "tobie@w3.org";
}

var subjectTemplate = handlebars.compile("{{#each labels}}[{{ this }}]{{/each}} {{ subject }} (#{{ number }})"),
    subjectTemplateResponse = handlebars.compile("Re: {{#each labels}}[{{ this }}]{{/each}} {{ subject }} (#{{ number }})"),
    fromTemplate = handlebars.compile("{{ name }} <{{email}}>"),
    bodyTemplate = handlebars.compile("{{ body }}\n\nView on GitHub: {{ link }}"),
    prClosedTemplate = handlebars.compile("Closed pull request #{{ number }}.\n\nView on GitHub: {{ link }}"),
    prMergedTemplate = handlebars.compile("Merged pull request #{{ number }}.\n\nView on GitHub: {{ link }}"),
    prSynchronizeTemplate = handlebars.compile("Updated pull request #{{ number }}.\n\nView on GitHub: {{ link }}"),
    prReopenedTemplate = handlebars.compile("Reopened pull request #{{ number }}.\n\nView on GitHub: {{ link }}"),
    messageIdTemplate = handlebars.compile("<web-platform-tests_issue_{{ number }}@w3.org>"),
    messageIdTimestampTemplate = handlebars.compile("<web-platform-tests_issue_{{ number }}_{{ timestamp }}@w3.org>");

exports.clarifyLabel = clarifyLabel;
function clarifyLabel(label) {
	if (label == "assets" || label == "infra") {
        return "test-" + label;
	}
	
	if (label == "old-tests") {
        return label;
	}
	
	if (/^wg-/.test(label)) {
        return null;
	}
    
	if (/^(?:enhancement|admin|reviewed|question|bug|duplicate|bug|wontfix|invalid)$/.test(label)) {
        return null;
	}
	
	return label + "-tests";
}

exports.filterLabel = filterLabel;
function filterLabel(label) {
	return !!label;
}

exports.notifyPullRequest = notifyPullRequest;
function notifyPullRequest(data, callback) {
    return github.get(data.pull_request.user.url).then(function(user) {
        var context = {
            body: data.pull_request.body,
            subject: data.pull_request.title,
            name: user.name || user.login,
            link: data.pull_request.html_url,
            number: data.number,
            labels: data.labels.map(clarifyLabel).filter(filterLabel).sort(),
            email: SENDER_EMAIL,
            timestamp: Date.now()
        };
        var body;
        switch (data.action) {
            case "opened":
                body = bodyTemplate(context);
                break;
            case "closed":
                if (data.pull_request.merged) {
                    body = prMergedTemplate(context);
                } else {
                    body = prClosedTemplate(context);
                }
                break;
            case "synchronize":
                body = prSynchronizeTemplate(context);
                break;
            case "reopened":
                body = prReopenedTemplate(context);
        }

        var messageId, inReplyTo, subject;
        if (data.action == "opened") {
            subject = subjectTemplate(context);
            messageId = messageIdTemplate(context);
            inReplyTo = null;
        } else {
            subject = subjectTemplateResponse(context);
            messageId = messageIdTimestampTemplate(context);
            inReplyTo = messageIdTemplate(context);
        }

        return email.sendMessage({
            messageId: messageId,
            inReplyTo: inReplyTo,
            references: inReplyTo,
            to: [MAILING_LIST],
            body: body,
            subject: subject,
            from: fromTemplate(context)
        });
    });
}

exports.notifyComment = notifyComment;
function notifyComment(data) {
    return github.get(data.comment.user.url).then(function(user) {
        // The below's a shortcut based on the shared id between PR and issues. Hacky.
        var url = data.comment.issue_url || data.comment.pull_request_url.replace("/pulls/", "/issues/");
        return github.get(url).then(function(issue) {
            var context = {
                body: data.comment.body,
                subject: issue.title,
                name: user.name || user.login,
                link: data.comment.html_url,
                number: issue.number,
                labels: issue.labels.map(funk.compose(clarifyLabel, funk.prop('name'))).filter(filterLabel).sort(),
                email: SENDER_EMAIL,
                timestamp: Date.now()
            };
            var inReplyTo = messageIdTemplate(context);

            return email.sendMessage({
                messageId: messageIdTimestampTemplate(context),
                inReplyTo: inReplyTo,
                references: inReplyTo,
                to: [MAILING_LIST],
                body: bodyTemplate(context),
                subject: subjectTemplateResponse(context),
                from: fromTemplate(context)
            });
        });
    });
}


