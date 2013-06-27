var USERNAME = 'web-platform-tests-notifications';
var SENDER_EMAIL = USERNAME + '@w3.org';
var PASSWORD = process.env.EMAIL_PASSWORD;

var nodemailer = require("nodemailer"),
    handlebars = require('handlebars');

var subjectTemplate = "{{#each labels}}[{{ this }}]{{/each}} {{ subject }} (#{{ number }})",
    bodyTemplate = "{{ body }}\n\nView on GitHub: {{ link }}",
    fromTemplate = "{{ name }} <" + SENDER_EMAIL + ">";

subjectTemplate = handlebars.compile(subjectTemplate);
bodyTemplate = handlebars.compile(bodyTemplate);
fromTemplate = handlebars.compile(fromTemplate);

exports.sendMessage = sendMessage;
function sendMessage(context, callback) {
    var smtpTransport = nodemailer.createTransport("SMTP", {
        host: "smtp-mit.w3.org",
        port: 587,
        auth: {
            user: USERNAME,
            pass: PASSWORD
        }
    });
    smtpTransport.sendMail({
        from: fromTemplate(context),
        to: context.to,
        subject: subjectTemplate(context),
        text: bodyTemplate(context)
    }, function(err, response) {
        callback(err, response);
        smtpTransport.close();
    });
}

