"use strict";
var USERNAME = 'web-platform-tests-notifications';
var PASSWORD = process.env.EMAIL_PASSWORD;

var nodemailer = require("nodemailer"),
    ent = require('ent'),
    q = require('q');

exports.sendMessage = sendMessage;
function sendMessage(context) {
    var smtpTransport = nodemailer.createTransport("SMTP", {
        host: "smtp-mit.w3.org",
        port: 587,
        auth: {
            user: USERNAME,
            pass: PASSWORD
        }
    });

    context.subject = ent.decode(context.subject);
    context.body = ent.decode(context.body);

    return q.ninvoke(smtpTransport, 'sendMail', context).finally(function() {
        smtpTransport.close();
    });
}
