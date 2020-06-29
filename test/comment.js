'use strict';

var assert = require('chai').assert,
    comment = require('../lib/comment');

suite('comment', function() {
    test('approves exported PRs', async function() {
        const metadata = {
            author: { login: "someuser" },
            reviewedDownstream: "Chromium",
        };
        // That the correct comment is made is enforced by the node-replay
        // fixtures for this test: comment-exported-prs-*
        const result = await comment(16780, metadata, false);
        assert.equal(result, true);
    });

    test('comments but does not approve webkit-exported PRs', async function() {
        // Exports from WebKit are only approved once they have r+ set
        // downstream (at which point 'reviewedDownstream' will be set). In the
        // meantime, we should not assign reviewers.
        const metadata = {
            author: { login: "someuser" },
            isWebKitVerified: true,
            reviewersExcludingAuthor: [],
        };
        // That the correct comment is made is enforced by the node-replay
        // fixtures for this test: comment-webkit-prs-*
        const result = await comment(16781, metadata, false);
        assert.equal(result, true);
    });

    test('approves CSS editor PRs for css/ files', async function() {
        const metadata = {
            author: { login: 'frivoal', },
            filenames: [ 'css/foo.html', ],
        };
        // That the correct comment is made is enforced by the node-replay
        // fixtures for this test: comment-css-editor-pr-*
        const result = await comment(16782, metadata, false);
        assert.equal(result, true);
    });

    test('does not approve CSS editor PRs for non-css/ files', async function() {
        const metadata = {
            author: { login: 'frivoal', },
            filenames: [ 'dom/bar.html', ],
            reviewersExcludingAuthor: [],
        };
        // That the correct comment is made is enforced by the node-replay
        // fixtures for this test: comment-css-editor-pr-non-css-file-*
        const result = await comment(16783, metadata, false);
        assert.equal(result, true);
    });

    test('adds missing assignee if there is one', async function() {
        const metadata = {
            author: { login: "someuser" },
            missingAssignee: 'Hexcles',
            reviewersExcludingAuthor: [],
        };
        // That the correct assignment and comment is made is enforced by the
        // node-replay fixtures for this test: comment-missing-assignee-*
        const result = await comment(16784, metadata, false);
        assert.equal(result, true);
    });

    test('adds missing reviewers if needed', async function() {
        const metadata = {
            author: { login: "someuser" },
            reviewersExcludingAuthor: ['stephenmcgruer'],
            missingReviewers: ['stephenmcgruer'],
            isMergeable: true,
        };
        // That the correct reviewers are added and NO comment is made is enforced
        // by the node-replay fixtures for this test: comment-add-missing-reviewers-*
        const result = await comment(16785, metadata, false);
        assert.equal(result, true);
    });

    test('adds missing reviewers if needed, and comments if the PR is non-mergeable', async function() {
        const metadata = {
            author: { login: "someuser" },
            reviewersExcludingAuthor: ['stephenmcgruer'],
            missingReviewers: ['stephenmcgruer'],
            isMergeable: false,
        };
        // That the correct reviewers are added and comment is made is enforced
        // by the node-replay fixtures for this test:
        // comment-add-missing-reviewers-not-mergeable-*
        const result = await comment(16786, metadata, false);
        assert.equal(result, true);
    });

    test('does nothing if we have all the reviewers and the PR is mergable', async function() {
        const metadata = {
            author: { login: "someuser" },
            reviewersExcludingAuthor: ['stephenmcgruer'],
            missingReviewers: [],
            isMergeable: true,
        };
        // That no comment is made is enforced by the LACK of node-replay
        // fixtures for this test.
        const result = await comment(16787, metadata, false);
        assert.equal(result, true);
    });

    test('handles the case where no reviewer has write-access to the repo', async function() {
        const metadata = {
            author: { login: "someuser" },
            reviewersExcludingAuthor: ['someuser'],
            missingReviewers: [],
            isMergeable: false,
        };
        // That the correct comment is made is enforced by the node-replay
        // fixtures for this test: comment-no-write-access-*
        const result = await comment(16788, metadata, false);
        assert.equal(result, true);
    });

    test('handles the case where the only reviewer is the author', async function() {
        const metadata = {
            reviewersExcludingAuthor: [],
            author: {
                login: 'stephenmcgruer',
                isOwner: true,
            }
        };
        // That the correct comment is made is enforced by the node-replay
        // fixtures for this test: comment-author-is-reviewer-*
        const result = await comment(16789, metadata, false);
        assert.equal(result, true);
    });

    test('handles the case where there are no reviewers', async function() {
        const metadata = {
            reviewersExcludingAuthor: [],
            author: {
                login: 'someuser',
                isOwner: false,
            }
        };
        // That the correct comment is made is enforced by the node-replay
        // fixtures for this test: comment-no-reviewers-*
        const result = await comment(16790, metadata, false);
        assert.equal(result, true);
    });

    test('does not comment twice', async function() {
        const metadata = {
            reviewersExcludingAuthor: [],
            author: {
                login: 'someuser',
                isOwner: false,
            }
        };
        // That a comment is not made is enforced by the node-replay
        // fixtures for this test: comment-duplicate-comment-*
        const result = await comment(16791, metadata, false);
        assert.equal(result, false);
    });
});
