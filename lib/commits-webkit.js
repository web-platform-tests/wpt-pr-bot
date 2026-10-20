"use strict";
const fetch = require('node-fetch');

const BASE_URL = 'https://commits.webkit.org';

// Only allow references to commits on WebKit's main branch, either as a
// canonical identifier (e.g. "324168@main") or as a legacy Subversion revision
// (e.g. "r266816"). References are parsed out of Bugzilla comments, so they
// are strictly validated before being used to build a URL.
const REF_PATTERN = /^(?:\d+@main|r\d+)$/;

/**
 * Retrieves information about a commit in the WebKit repository.
 *
 * @param {string} ref A commit reference, e.g. "324168@main" or "r266816".
 * @return {Promise<object|null>} The commit (with `hash`, `branch`,
 *     `identifier`, `revision` and `message` fields), or null if no such
 *     commit exists.
 */
async function get(ref) {
    if (typeof ref !== 'string' || !REF_PATTERN.test(ref)) {
        throw new Error(`Invalid WebKit commit reference: ${ref}`);
    }
    const response = await exports.fetch(`${BASE_URL}/${ref}/json`, {
        headers: { "User-Agent": "wpt-pr-bot" },
    });
    if (response.status === 404) {
        return null;
    }
    if (!response.ok) {
        throw new Error(`Unexpected status ${response.status} from ${BASE_URL} for ${ref}`);
    }
    return response.json();
}

exports.get = get;
// Exposed so that tests can stub out network access.
exports.fetch = fetch;
