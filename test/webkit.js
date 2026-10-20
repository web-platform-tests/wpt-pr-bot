'use strict';

var assert = require('chai').assert,
    sinon = require('sinon'),
    bugsWebkit = require('../lib/bugs-webkit'),
    commitsWebkit = require('../lib/commits-webkit'),
    webkit = require('../lib/metadata/webkit');

const BUG = '12345';
const BUG_URL = `https://bugs.webkit.org/show_bug.cgi?id=${BUG}`;
const HASH = '004e01c34435249ef9bc54e0856cadb3ebc13856';

function resolvedFixedBy(who) {
    return {
        who: who,
        changes: [
            { field_name: 'status', removed: 'NEW', added: 'RESOLVED' },
            { field_name: 'resolution', removed: '', added: 'FIXED' },
        ],
    };
}

function landingComment(creator, text) {
    return {
        creator: creator,
        text: text || 'Committed 324168@main (004e01c34435): <https://commits.webkit.org/324168@main>\n\n' +
            'Reviewed commits have been landed. Closing PR #77500 and removing active labels.',
    };
}

function mainCommit(overrides) {
    return Object.assign({
        hash: HASH,
        branch: 'main',
        identifier: '324168@main',
        revision: null,
        message: `Do the thing\n${BUG_URL}\nrdar://190417737\n\nReviewed by Someone.\n`,
    }, overrides);
}

suite('webkit', function() {
    var sandbox, bugsGet, commitsGet;

    setup(function() {
        sandbox = sinon.createSandbox();
        bugsGet = sandbox.stub(bugsWebkit, 'get');
        bugsGet.rejects(new Error('unexpected bugs.webkit.org request'));
        commitsGet = sandbox.stub(commitsWebkit, 'get');
        commitsGet.rejects(new Error('unexpected commits.webkit.org request'));
    });

    teardown(function() {
        sandbox.restore();
    });

    function stubHistory(history) {
        bugsGet.withArgs('/rest/bug/:id/history', { id: BUG })
            .resolves({ bugs: [ { history: history } ] });
    }

    function stubComments(comments) {
        bugsGet.withArgs('/rest/bug/:id/comment', { id: BUG })
            .resolves({ bugs: { [BUG]: { comments: comments } } });
    }

    function stubCommit(ref, commit) {
        commitsGet.withArgs(ref).resolves(commit);
    }

    suite('flags', function() {
        [
            'ews-feeder',
            'commit-queue',
            'ews-feeder@webkit.org',
            'commit-queue@webkit.org',
        ].forEach(function(who) {
            test(`treats a verified landing resolved FIXED by ${who} as reviewed`, async function() {
                stubHistory([ resolvedFixedBy(who) ]);
                stubComments([ landingComment(who) ]);
                stubCommit('324168@main', mainCommit());
                var flags = await webkit.flags(BUG);
                assert.deepEqual(flags, { reviewed: true, inCommit: true });
            });
        });

        [
            ['another user', 'annevk'],
            ['an email on another domain', 'ews-feeder@example.com'],
            ['a lookalike domain', 'ews-feeder@webkit.org.example.com'],
            ['a different case', 'EWS-Feeder'],
            ['a missing user', undefined],
        ].forEach(function([description, who]) {
            test(`does not treat a bug resolved FIXED by ${description} as reviewed`, async function() {
                stubHistory([ resolvedFixedBy(who) ]);
                var flags = await webkit.flags(BUG);
                assert.deepEqual(flags, { reviewed: false, inCommit: false });
                // No further verification should be attempted.
                assert.isFalse(bugsGet.calledWith('/rest/bug/:id/comment'));
                assert.isFalse(commitsGet.called);
            });
        });

        test('does not treat an unverified landing as reviewed', async function() {
            // Simulates an attacker who registered "ews-feeder@example.com"
            // (which Bugzilla reports as "ews-feeder") and resolved their own
            // bug as FIXED, without anything landing in WebKit.
            stubHistory([ resolvedFixedBy('ews-feeder') ]);
            stubComments([ { creator: 'ews-feeder', text: 'Closing.' } ]);
            var flags = await webkit.flags(BUG);
            assert.deepEqual(flags, { reviewed: false, inCommit: false });
        });

        test('treats review+ as reviewed without verifying a landing', async function() {
            stubHistory([ {
                who: 'reviewer',
                changes: [
                    { field_name: 'flagtypes.name', removed: 'review?', added: 'review+' },
                ],
            } ]);
            var flags = await webkit.flags(BUG);
            assert.deepEqual(flags, { reviewed: true, inCommit: false });
            assert.isFalse(commitsGet.called);
        });

        test('a verified landing after flags were cleared is reviewed', async function() {
            stubHistory([
                {
                    who: 'reviewer',
                    changes: [
                        { field_name: 'flagtypes.name', removed: '', added: 'review+, commit-queue+' },
                    ],
                },
                {
                    who: 'commit-queue',
                    changes: [
                        { field_name: 'flagtypes.name', removed: 'review+, commit-queue+', added: '' },
                    ],
                },
                resolvedFixedBy('commit-queue'),
            ]);
            stubComments([ landingComment('commit-queue',
                'Committed r251544: <https://trac.webkit.org/changeset/251544>') ]);
            stubCommit('r251544', mainCommit({ revision: 251544 }));
            var flags = await webkit.flags(BUG);
            assert.deepEqual(flags, { reviewed: true, inCommit: true });
        });
    });

    suite('landed', function() {
        test('accepts a landing comment in the git identifier format', async function() {
            stubComments([ landingComment('ews-feeder') ]);
            stubCommit('324168@main', mainCommit());
            assert.isTrue(await webkit.landed(BUG));
        });

        test('accepts a landing comment in the Subversion format', async function() {
            stubComments([ landingComment('commit-queue@webkit.org',
                'Comment on attachment 1\nPatch\n\nCommitted r266816: <https://trac.webkit.org/changeset/266816>') ]);
            stubCommit('r266816', mainCommit({ revision: 266816 }));
            assert.isTrue(await webkit.landed(BUG));
        });

        test('accepts a commit message using the webkit.org/b/ short form', async function() {
            stubComments([ landingComment('ews-feeder') ]);
            stubCommit('324168@main', mainCommit({ message: `Fix\nhttps://webkit.org/b/${BUG}\n` }));
            assert.isTrue(await webkit.landed(BUG));
        });

        test('checks every referenced commit', async function() {
            stubComments([
                landingComment('ews-feeder',
                    'Committed 1@main (aaaaaaaaaaaa): <x>\nCommitted 324168@main (004e01c34435): <y>'),
            ]);
            stubCommit('1@main', null);
            stubCommit('324168@main', mainCommit());
            assert.isTrue(await webkit.landed(BUG));
        });

        test('ignores landing comments from other users', async function() {
            stubComments([ landingComment('attacker') ]);
            stubCommit('324168@main', mainCommit());
            assert.isFalse(await webkit.landed(BUG));
            assert.isFalse(commitsGet.called);
        });

        test('rejects a commit that does not exist', async function() {
            stubComments([ landingComment('ews-feeder') ]);
            stubCommit('324168@main', null);
            assert.isFalse(await webkit.landed(BUG));
        });

        test('rejects a commit that is not on main', async function() {
            stubComments([ landingComment('ews-feeder') ]);
            stubCommit('324168@main', mainCommit({ branch: 'safari-7620-branch' }));
            assert.isFalse(await webkit.landed(BUG));
        });

        test('rejects a commit whose hash does not match the comment', async function() {
            stubComments([ landingComment('ews-feeder') ]);
            stubCommit('324168@main', mainCommit({ hash: 'ffffffffffff249ef9bc54e0856cadb3ebc13856' }));
            assert.isFalse(await webkit.landed(BUG));
        });

        test('rejects a commit for a different bug', async function() {
            // Pointing at a real, unrelated WebKit commit must not work.
            stubComments([ landingComment('ews-feeder') ]);
            stubCommit('324168@main', mainCommit({
                message: 'Unrelated\nhttps://bugs.webkit.org/show_bug.cgi?id=99999\n',
            }));
            assert.isFalse(await webkit.landed(BUG));
        });

        test('rejects a commit for a bug whose number has this bug as a prefix', async function() {
            stubComments([ landingComment('ews-feeder') ]);
            stubCommit('324168@main', mainCommit({ message: `Unrelated\n${BUG_URL}6\n` }));
            assert.isFalse(await webkit.landed(BUG));
        });

        test('rejects a commit without a message', async function() {
            stubComments([ landingComment('ews-feeder') ]);
            stubCommit('324168@main', mainCommit({ message: undefined }));
            assert.isFalse(await webkit.landed(BUG));
        });

        test('ignores comments without a landing reference', async function() {
            stubComments([
                { creator: 'ews-feeder', text: 'Committed nothing in particular' },
                { creator: 'ews-feeder', text: 'Committed 123@safari-7620-branch (abcdef1): <x>' },
                { creator: 'ews-feeder' },
            ]);
            assert.isFalse(await webkit.landed(BUG));
            assert.isFalse(commitsGet.called);
        });

        test('treats errors from commits.webkit.org as not landed', async function() {
            stubComments([ landingComment('ews-feeder') ]);
            commitsGet.withArgs('324168@main').rejects(new Error('Unexpected status 503'));
            assert.isFalse(await webkit.landed(BUG));
        });

        test('handles a response without comments', async function() {
            bugsGet.withArgs('/rest/bug/:id/comment', { id: BUG }).resolves({ bugs: {} });
            assert.isFalse(await webkit.landed(BUG));
        });
    });
});
