// istanbul ignore file

"use strict";

var t0 = Date.now();

const bl = require("bl"),
      bugsWebkit = require('./lib/bugs-webkit'),
      checkRequest = require('./lib/check-request'),
      comment = require('./lib/comment'),
      express = require("express"),
      filter = require('./lib/filter'),
      flags = require('flags'),
      get_metadata = require('./lib/metadata'),
      github = require('./lib/github'),
      labelModel = require('./lib/label-model'),
      logger = require('./lib/logger'),
      webkit = require('./lib/metadata/webkit');

flags.defineBoolean('dry-run', false, 'Run in dry-run mode (no POSTs to GitHub)');
flags.parse();

function waitFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var app = module.exports = express();

function funkLogMsg(num, msg) {
    return function() { logger.info("#" + num + ": " + msg); };
}

function funkLogErr(num, msg) {
    return function(err) { logger.error("#" + num + ": " + msg + "\n", err); };
}

// Load the secrets in.
let secrets;
try {
    secrets = require('./secrets.json');
} catch (err) {
    logger.warn(`Unable to load secrets.json, falling back to env (error: ${err})`);
    secrets = {
        bugsWebkitToken: process.env.WEBKIT_BUGZILLA_TOKEN,
        githubToken: process.env.GITHUB_TOKEN,
        webhookSecret: process.env.GITHUB_SECRET,
    };
}
// TODO(stephenmcgruer): Refactor code to avoid awkward global setter.
bugsWebkit.setToken(secrets.bugsWebkitToken);
github.setToken(secrets.githubToken);

var currentlyRunning = {};

app.post('/github-hook', function (req, res) {
    req.pipe(bl(function (err, body) {
        if (err) {
            logger.error(err.message);
        } else if (process.env.NODE_ENV != 'production' || checkRequest(body, req.headers["x-hub-signature"], secrets.webhookSecret)) {
            res.send(new Date().toISOString());

            try {
                body = JSON.parse(body);
            } catch(e) {
                return;
            }
            if (!filter.event(body, logger.info)) {
                return;
            }
            if (!filter.pullRequest(body.pull_request, logger.info)) {
                return;
            }

            var action = body.action;
            var pr = body.pull_request;
            var n = pr.number;
            var u = (pr.user && pr.user.login) || null;
            var content = pr.body || "";
            var title = pr.title || "";
            if (action == "opened" || action == "synchronize" ||
                action == "ready_for_review") {
                if (n in currentlyRunning) {
                    logger.info("#" + n + " is already being processed.");
                    return;
                }
                currentlyRunning[n] = true;
                logger.info(`#${n}: ${action}`);

                waitFor(5 * 1000).then(function() { // Avoid race condition
                    return get_metadata(n, u, title, content).then(function(metadata) {
                        logger.info({metadata: metadata}, `#${n}: Retrieved metadata for pull request`);
                        return labelModel.post(n, metadata.labels, flags.get('dry-run')).then(
                            funkLogMsg(n, "Added missing LABELS if any."),
                            funkLogErr(n, "Something went wrong while adding missing LABELS.")
                        ).then(function() {
                            return comment(n, metadata, flags.get('dry-run'));
                        }).then(
                            funkLogMsg(n, "Added missing REVIEWERS if any."),
                            funkLogErr(n, "Something went wrong while adding missing REVIEWERS.")
                        );
                    });
                }).then(function() {
                    delete currentlyRunning[n];
                }, function(err) {
                    delete currentlyRunning[n];
                    funkLogErr(n, "THIS SHOULDN'T EVER HAPPEN")(err);
                });
            } else {
                logger.info(`#${n}: ignoring action ${action}`);
            }
        } else {
            // Not an error, since anyone can send requests to us.
            logger.info("Unverified request", req);
        }
    }));
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    logger.info("Express server listening on port %d in %s mode", port, app.settings.env);
    logger.info("App started in", (Date.now() - t0) + "ms.");
    if (flags.get('dry-run'))
        logger.info('Starting in DRY-RUN mode');
});

// In addition to listening for notifications from GitHub, we regularly poll the
// set of PRs to keep WebKit exports synchronized with the upstream PR.
async function pullRequestPoller() {
    // As currently written, the WebKit PR poller does a huge number of API
    // requests and can cause us to hit the GitHub API limit. To mitigate this,
    // we currently only run it every 15 minutes.
    // See https://github.com/web-platform-tests/wpt-pr-bot/issues/144
    await waitFor(15 * 60 * 1000);

    logger.info('Checking for changes to WebKit-exported pull requests');
    try {
        const pull_requests = await github.get("/repos/:owner/:repo/pulls", {});
        pull_requests.forEach(async function(pull_request) {
            if (!webkit.related(pull_request.title)) {
                return;
            }
            const metadata = await get_metadata(
                pull_request.number,
                pull_request.user.login,
                pull_request.title,
                pull_request.body);

            const n = pull_request.number;

            logger.info({webkitExport: {
                issue: metadata.issue,
                title: metadata.title,
                labels: metadata.labels,
                isWebKitVerified: metadata.isWebKitVerified,
                isMergeable: metadata.isMergeable,
                reviewedDownstream: metadata.reviewedDownstream,
                flags: metadata.webkit.flags || {},
            }}, `#${n}: Labelling and approving WebKit issue, if necessary`);

            return labelModel.post(n, metadata.labels, flags.get('dry-run')).then(
                 funkLogMsg(n, "Added missing LABELS if any."),
                 funkLogErr(n, "Something went wrong while adding missing LABELS.")
            ).then(function() {
                return comment(n, metadata, flags.get('dry-run'));
            }).then(
                funkLogMsg(n, "Added missing REVIEWERS if any."),
                funkLogErr(n, "Something went wrong while adding missing REVIEWERS.")
            );
        });
    } catch (e) {
        // Assume that errors are likely recoverable, so log them and try again
        // next time.
        logger.error(e);
    }

    pullRequestPoller();
}

pullRequestPoller();
