'use strict';

var assert = require('chai').assert,
    pollWebKitExports = require('../lib/webkit-poller');

function pr(number, title) {
    return {
        number: number,
        title: title || `WebKit export of https://bugs.webkit.org/show_bug.cgi?id=${number}`,
        user: { login: 'someuser' },
        body: 'body',
    };
}

/**
 * Builds fake dependencies for the poller. `overrides` can replace
 * getMetadata, labelPost or comment for specific behaviour.
 */
function fakeDeps(pullRequests, overrides) {
    overrides = overrides || {};
    const calls = { getMetadata: [], labelPost: [], comment: [], info: [], error: [] };
    let inFlight = 0;
    calls.maxInFlight = 0;

    async function tracked(fn) {
        inFlight++;
        calls.maxInFlight = Math.max(calls.maxInFlight, inFlight);
        try {
            // Yield so that concurrent processing would be observable.
            await new Promise(resolve => setImmediate(resolve));
            return await fn();
        } finally {
            inFlight--;
        }
    }

    const deps = {
        github: {
            get: async (path) => {
                assert.equal(path, '/repos/:owner/:repo/pulls');
                return pullRequests;
            },
        },
        webkit: require('../lib/metadata/webkit'),
        getMetadata: (number, login, title, body) => tracked(async () => {
            calls.getMetadata.push(number);
            if (overrides.getMetadata) {
                return overrides.getMetadata(number, login, title, body);
            }
            return {
                issue: number,
                title: title,
                labels: ['webkit-export'],
                isWebKitVerified: true,
                reviewedDownstream: 'WebKit',
                webkit: { flags: { reviewed: true, inCommit: true } },
            };
        }),
        labelModel: {
            post: async (number, labels, dryRun) => {
                calls.labelPost.push({ number: number, labels: labels, dryRun: dryRun });
                if (overrides.labelPost) {
                    return overrides.labelPost(number);
                }
                return labels;
            },
        },
        comment: async (number, metadata, dryRun) => {
            calls.comment.push({ number: number, dryRun: dryRun });
            if (overrides.comment) {
                return overrides.comment(number);
            }
            return true;
        },
        logger: {
            info: function() { calls.info.push(Array.from(arguments)); },
            error: function() { calls.error.push(Array.from(arguments)); },
        },
    };
    return { deps: deps, calls: calls };
}

suite('pollWebKitExports', function() {
    test('labels and comments on each WebKit export, ignoring other PRs', async function() {
        const { deps, calls } = fakeDeps([
            pr(1),
            pr(2, 'Not a WebKit export'),
            pr(3),
        ]);
        const failed = await pollWebKitExports(false, deps);
        assert.deepEqual(failed, []);
        assert.deepEqual(calls.getMetadata, [1, 3]);
        assert.deepEqual(calls.labelPost.map(c => c.number), [1, 3]);
        assert.deepEqual(calls.labelPost[0].labels, ['webkit-export']);
        assert.deepEqual(calls.comment.map(c => c.number), [1, 3]);
        assert.deepEqual(calls.error, []);
        const exportLog = calls.info.find(args => args[0].webkitExport);
        assert.equal(exportLog[0].webkitExport.reviewedDownstream, 'WebKit');
        assert.deepEqual(exportLog[0].webkitExport.flags, { reviewed: true, inCommit: true });
        assert.include(calls.info[calls.info.length - 1][0],
                       'Checked 2 WebKit-exported pull requests; 0 failed.');
    });

    test('passes dry-run through', async function() {
        const { deps, calls } = fakeDeps([pr(1)]);
        await pollWebKitExports(true, deps);
        assert.equal(calls.labelPost[0].dryRun, true);
        assert.equal(calls.comment[0].dryRun, true);
    });

    test('logs empty flags when the PR is not verified', async function() {
        const { deps, calls } = fakeDeps([pr(1)], {
            getMetadata: (number, login, title) => ({
                issue: number, title: title, labels: [], isWebKitVerified: false,
                reviewedDownstream: null, webkit: { issue: '1' },
            }),
        });
        await pollWebKitExports(false, deps);
        const exportLog = calls.info.find(args => args[0].webkitExport);
        assert.deepEqual(exportLog[0].webkitExport.flags, {});
    });

    // Regression test: a failed bugs.webkit.org request for one PR used to be
    // an unhandled rejection that crashed the process mid-poll, so that no PR
    // was approved.
    test('a failure on one PR does not stop the others', async function() {
        const { deps, calls } = fakeDeps([pr(1), pr(2), pr(3)], {
            getMetadata: (number, login, title) => {
                if (number == 2) {
                    throw new Error('invalid json response body at https://bugs.webkit.org/rest/bug/2/history');
                }
                return { issue: number, title: title, labels: [], webkit: {} };
            },
        });
        const failed = await pollWebKitExports(false, deps);
        assert.deepEqual(failed, [2]);
        assert.deepEqual(calls.getMetadata, [1, 2, 3]);
        assert.deepEqual(calls.comment.map(c => c.number), [1, 3]);
        assert.equal(calls.error.length, 1);
        assert.include(calls.error[0][0].message, 'invalid json response body');
        assert.include(calls.error[0][1], '#2: Unable to check WebKit export');
        assert.include(calls.info[calls.info.length - 1][0],
                       'Checked 3 WebKit-exported pull requests; 1 failed.');
    });

    test('still comments when adding labels fails', async function() {
        const { deps, calls } = fakeDeps([pr(1)], {
            labelPost: () => { throw new Error('label failure'); },
        });
        const failed = await pollWebKitExports(false, deps);
        assert.deepEqual(failed, []);
        assert.deepEqual(calls.comment.map(c => c.number), [1]);
        assert.equal(calls.error.length, 1);
        assert.include(calls.error[0][1], '#1: Something went wrong while adding missing LABELS.');
    });

    test('reports a failure to comment and continues', async function() {
        const { deps, calls } = fakeDeps([pr(1), pr(2)], {
            comment: (number) => {
                if (number == 1) {
                    throw new Error('comment failure');
                }
                return true;
            },
        });
        const failed = await pollWebKitExports(false, deps);
        assert.deepEqual(failed, [1]);
        assert.deepEqual(calls.comment.map(c => c.number), [1, 2]);
        assert.equal(calls.error.length, 1);
    });

    test('handles pull requests one at a time', async function() {
        const { deps, calls } = fakeDeps([pr(1), pr(2), pr(3), pr(4)]);
        await pollWebKitExports(false, deps);
        assert.equal(calls.maxInFlight, 1);
    });

    test('rejects if the pull requests cannot be listed', async function() {
        const { deps } = fakeDeps([]);
        deps.github.get = async () => { throw new Error('GitHub is down'); };
        let error;
        try {
            await pollWebKitExports(false, deps);
        } catch (e) {
            error = e;
        }
        assert.equal(error && error.message, 'GitHub is down');
    });
});
