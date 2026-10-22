"use strict";

const comment = require('./comment'),
      getMetadata = require('./metadata'),
      github = require('./github'),
      labelModel = require('./label-model'),
      logger = require('./logger'),
      webkit = require('./metadata/webkit');

const defaultDeps = {
    comment: comment,
    getMetadata: getMetadata,
    github: github,
    labelModel: labelModel,
    logger: logger,
    webkit: webkit,
};

/**
 * Checks every open WebKit-exported pull request once, adding any missing
 * labels and approving it if the WebKit patch has been reviewed downstream.
 *
 * Pull requests are handled one at a time, both to limit the load on
 * bugs.webkit.org and so that an error while handling one pull request (e.g. a
 * failed request to bugs.webkit.org) is logged and skipped rather than
 * stopping the others from being checked. Previously such an error was an
 * unhandled rejection, which crashed the process. Skipped pull requests are
 * retried on the next poll.
 *
 * @param {boolean} dryRun Whether to avoid making changes on GitHub.
 * @param {object} [deps] Overrides for the modules used; for testing.
 * @returns {Promise<number[]>} The numbers of the pull requests that could not
 *     be handled.
 */
module.exports = async function pollWebKitExports(dryRun, deps) {
    deps = deps || defaultDeps;
    const log = deps.logger;

    const pullRequests = await deps.github.get('/repos/:owner/:repo/pulls', {});
    const failed = [];
    let checked = 0;
    for (const pullRequest of pullRequests) {
        if (!deps.webkit.related(pullRequest.title)) {
            continue;
        }
        checked++;
        const n = pullRequest.number;
        try {
            const metadata = await deps.getMetadata(
                n,
                pullRequest.user.login,
                pullRequest.title,
                pullRequest.body);

            log.info({webkitExport: {
                issue: metadata.issue,
                title: metadata.title,
                labels: metadata.labels,
                isWebKitVerified: metadata.isWebKitVerified,
                isMergeable: metadata.isMergeable,
                reviewedDownstream: metadata.reviewedDownstream,
                flags: (metadata.webkit && metadata.webkit.flags) || {},
            }}, `#${n}: Labelling and approving WebKit issue, if necessary`);

            // As before, a failure to add labels is logged but doesn't stop
            // the pull request from being approved.
            try {
                await deps.labelModel.post(n, metadata.labels, dryRun);
                log.info(`#${n}: Added missing LABELS if any.`);
            } catch (e) {
                log.error(e, `#${n}: Something went wrong while adding missing LABELS.`);
            }

            await deps.comment(n, metadata, dryRun);
            log.info(`#${n}: Added missing REVIEWERS if any.`);
        } catch (e) {
            failed.push(n);
            log.error(e, `#${n}: Unable to check WebKit export; will retry on the next poll.`);
        }
    }

    log.info(`Checked ${checked} WebKit-exported pull requests; ${failed.length} failed.`);
    return failed;
};
