var email = require('./email'),
    github = require('./github');
    
var MAILING_LIST = "public-web-platform-tests-notifications@w3.org";

exports.notifyPullRequest = notifyPullRequest;
function notifyPullRequest(context, callback) {
    github.get(context.pull_request.user.url, function(err, user) {
        if (err) return callback(err)
        email.sendMessage({
            to: [MAILING_LIST],
            body: context.pull_request.body,
            subject: context.pull_request.title,
            name: user.name,
            link: context.pull_request.html_url,
            number: context.number,
            labels: context.labels.sort()
        }, callback);
    });
}
