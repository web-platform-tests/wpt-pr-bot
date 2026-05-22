"use strict";
var bugsWebkit = require('../bugs-webkit');

exports.related = function(title) {
    return title.indexOf("WebKit export of") > -1;
};

exports.verified = function(webkitIssue, wptPullRequestNumber) {
        return bugsWebkit.get("/rest/bug/:id", { id: webkitIssue }).then(function (body) {
            if (body && body.bugs && body.bugs.length > 0 && body.bugs[0].see_also) {
                return body.bugs[0].see_also.some(function(url) {
                    return url == "https://github.com/web-platform-tests/wpt/pull/" + wptPullRequestNumber;
                });
            }
            return false;
        });
};

exports.flags = function(issue) {
        var flags = {
            inCommit: false
        };
        return bugsWebkit.get("/rest/bug/:id/history", { id: issue }).then(function (body) {
            body.bugs[0].history.forEach(function(history_item) {
                history_item.changes.forEach(function(change) {
                    if (change.field_name == "resolution") {
                        if (change.added.includes("FIXED") && ["ews-feeder@webkit.org", "commit-queue@webkit.org"].includes(history_item.who)) {
                            flags.inCommit = true;
                        }
                    }
                });
            });
            return flags;
        });
};
