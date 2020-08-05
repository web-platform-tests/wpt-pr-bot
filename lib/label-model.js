// istanbul ignore file

"use strict";

var github = require('./github'),
    funk = require('./funk'),
    complement = require('./complement');

/**
 * Adds a set of labels to a WPT pull request or issue, returning the set of
 * labels that were newly added (i.e. didn't already exist on the PR/issue).
 */
exports.post = post;
async function post(issue, labels, log, dryRun) {
    const existingLabels = await get(issue);
    const newLabels = await complement(existingLabels, labels);
    if (!newLabels.length) { return newLabels; }

    if (dryRun) {
        log(`[DRY-RUN] Would add labels ${newLabels} to PR ${issue}`);
        return newLabels;
    }

    const addedLabels = await github.post('/repos/:owner/:repo/issues/:number/labels', newLabels, { number: issue });
    return addedLabels.map(funk.prop('name'));
}

/**
 * Returns the currnet set of labels for a WPT pull request or issue.
 */
exports.get = get;
async function get(issue) {
    const issueLabels = await github.get('/repos/:owner/:repo/issues/:number/labels', { number: issue });
    return issueLabels.map(funk.prop('name'));
}
