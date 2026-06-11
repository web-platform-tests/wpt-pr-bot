"use strict";
var bugsWebkit = require('../bugs-webkit');
const chunks = require('../chunks');

exports.related = function(title) {
    return title.indexOf("WebKit export of") > -1;
};

exports.bugIdFromTitle = function(title) {
    const match = title.match(/.*http(?:s?):\/\/bugs.webkit.org\/show_bug.cgi\?id=(\d+).*/i);
    if (match) {
        return parseInt(match[1], 10);
    }
    return null;
};

exports.fetchBug = async function(issue) {
    const body = await bugsWebkit.get("/rest/bug/:id", { id: issue });
    if (!body || !body.bugs || body.bugs.length === 0) return null;
    return body.bugs[0];
};

exports.verified = function(bug, wptPullRequestNumber) {
    return !!(bug && bug.see_also && bug.see_also.some(function(url) {
        return url == "https://github.com/web-platform-tests/wpt/pull/" + wptPullRequestNumber;
    }));
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

// bugs.webkit.org rejects overly long URLs (opaque 403), so query in modest chunks.
const CHUNK_SIZE = 50;

// Query bugs whose resolution has, at any point, transitioned to FIXED.
// Returns a map of {bugId: bugObject}.
exports.everFixed = async function(bugIds) {
    const result = new Map();
    for (const chunk of chunks(bugIds, CHUNK_SIZE)) {
        const params = new URLSearchParams({
            id: chunk.join(","),
            f1: "resolution",
            o1: "changedto",
            v1: "FIXED"
        });
        const body = await bugsWebkit.get("/rest/bug?" + params);
        for (const bug of body.bugs || []) {
            result.set(bug.id, bug);
        }
    }
    return result;
};
