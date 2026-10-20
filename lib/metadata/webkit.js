"use strict";
var bugsWebkit = require('../bugs-webkit');

// Accounts that resolve a bug as FIXED when a reviewed patch lands in WebKit.
const WEBKIT_LANDING_BOTS = ["ews-feeder", "commit-queue"];

// bugs.webkit.org historically reported the `who` field of bug history as a
// full email address (e.g. "ews-feeder@webkit.org"), but now reports the bare
// login name (e.g. "ews-feeder"). Accept either form.
function isWebKitLandingBot(who) {
    if (typeof who !== "string") {
        return false;
    }
    var at = who.indexOf("@");
    if (at > -1) {
        if (who.slice(at + 1) !== "webkit.org") {
            return false;
        }
        who = who.slice(0, at);
    }
    return WEBKIT_LANDING_BOTS.includes(who);
}

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
            reviewed: false,
            inCommit: false
        };
        return bugsWebkit.get("/rest/bug/:id/history", { id: issue }).then(function (body) {
            body.bugs[0].history.forEach(function(history_item) {
                history_item.changes.forEach(function(change) {
                    if (change.field_name == "flagtypes.name") {
                        if (change.removed.includes("review+")) {
                            flags.reviewed = false;
                        }
                        if (change.removed.includes("commit-queue+")) {
                            flags.reviewed = false;
                            flags.inCommit = false;
                        }
                        if (change.added.includes("review+")) {
                            flags.reviewed = true;
                        }
                        if (change.added.includes("commit-queue+")) {
                            flags.reviewed = true;
                            flags.inCommit = true;
                        }
                    }
                    if (change.field_name == "resolution") {
                        if (change.added.includes("FIXED") && isWebKitLandingBot(history_item.who)) {
                            flags.reviewed = true;
                            flags.inCommit = true;
                        }
                    }
                });
            });
            return flags;
        });
};
