"use strict";
var bugsWebkit = require('../bugs-webkit'),
    commitsWebkit = require('../commits-webkit'),
    logger = require('../logger');

// Accounts that resolve a bug as FIXED when a reviewed patch lands in WebKit.
const WEBKIT_LANDING_BOTS = ["ews-feeder", "commit-queue"];

// Matches the comment left by WebKit's landing bots, e.g.
//   "Committed 324168@main (004e01c34435): <https://commits.webkit.org/324168@main>"
//   "Committed r266816: <https://trac.webkit.org/changeset/266816>"
const LANDING_COMMENT_PATTERN = /Committed (\d+@main|r\d+)(?: \(([0-9a-f]{7,40})\))?/g;

// bugs.webkit.org historically reported user identities (e.g. the `who` field
// of bug history) as full email addresses (e.g. "ews-feeder@webkit.org"), but
// now applies Bugzilla's email filtering for logged-out users, which reports
// only the local part of the address (e.g. "ews-feeder"). Accept either form.
//
// IMPORTANT: The local part alone is NOT a unique identity; anyone can register
// an account such as "ews-feeder@example.com", which is reported as
// "ews-feeder". This check is therefore only a cheap pre-filter, and a landing
// must additionally be verified against the WebKit repository (see `landed`).
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

// Returns true if `commit` (as returned by commits-webkit) is a commit on
// WebKit's main branch whose message references the given WebKit bug.
function isLandedCommitForBug(commit, issue, abbreviatedHash) {
    if (!commit || commit.branch !== "main" || typeof commit.message !== "string") {
        return false;
    }
    if (abbreviatedHash && (typeof commit.hash !== "string" || !commit.hash.startsWith(abbreviatedHash))) {
        return false;
    }
    // `issue` is always numeric (it is extracted with /\d+/ from the PR title),
    // so it is safe to embed in the pattern. The negative lookahead prevents
    // e.g. bug 12345 from matching a reference to bug 123456.
    var bugURLPattern = new RegExp(
        `(?:https?://bugs\\.webkit\\.org/show_bug\\.cgi\\?id=|https?://webkit\\.org/b/)${issue}(?!\\d)`);
    return bugURLPattern.test(commit.message);
}

// Determines whether a change for the given WebKit bug has actually landed on
// WebKit's main branch.
//
// Bugzilla identities cannot be trusted (see `isWebKitLandingBot`), and nor can
// comment text, so this looks for the "Committed ..." comment left by the
// landing bot and then confirms with the WebKit repository itself (via
// commits.webkit.org) that the referenced commit exists on main and that its
// message references this bug. Only WebKit committers can land on main, so
// this cannot be spoofed by an arbitrary Bugzilla user.
//
// Errors talking to commits.webkit.org are logged and treated as "not landed";
// the pull request poller will try again later.
exports.landed = async function(issue) {
    var body = await bugsWebkit.get("/rest/bug/:id/comment", { id: issue });
    var bug = body && body.bugs && body.bugs[issue];
    var comments = (bug && bug.comments) || [];
    for (var comment of comments) {
        if (!isWebKitLandingBot(comment.creator) || typeof comment.text !== "string") {
            continue;
        }
        for (var match of comment.text.matchAll(LANDING_COMMENT_PATTERN)) {
            var ref = match[1], abbreviatedHash = match[2];
            try {
                var commit = await commitsWebkit.get(ref);
                if (isLandedCommitForBug(commit, issue, abbreviatedHash)) {
                    return true;
                }
            } catch (e) {
                logger.warn({ err: e, webkitIssue: issue, ref: ref },
                    `Unable to verify WebKit commit ${ref} for bug ${issue}`);
            }
        }
    }
    return false;
};

function isLandingResolution(history_item, change) {
    return change.field_name == "resolution" &&
        change.added.includes("FIXED") &&
        isWebKitLandingBot(history_item.who);
}

exports.flags = function(issue) {
        var flags = {
            reviewed: false,
            inCommit: false
        };
        return bugsWebkit.get("/rest/bug/:id/history", { id: issue }).then(async function (body) {
            var history = body.bugs[0].history;
            // Only verify the landing (which requires additional network
            // requests) if the history claims that a landing bot fixed the bug.
            var claimsLanding = history.some(function(history_item) {
                return history_item.changes.some(function(change) {
                    return isLandingResolution(history_item, change);
                });
            });
            var landed = claimsLanding && await exports.landed(issue);
            history.forEach(function(history_item) {
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
                    if (landed && isLandingResolution(history_item, change)) {
                        flags.reviewed = true;
                        flags.inCommit = true;
                    }
                });
            });
            return flags;
        });
};
