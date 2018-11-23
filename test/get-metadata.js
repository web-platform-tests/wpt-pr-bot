'use strict';
var assert = require('chai').assert,
    sinon = require('sinon'),
    getMetadata = require('../lib/metadata');

suite('getMetadata', function() {
    let sandbox;
    setup(() => {
        sandbox = sinon.createSandbox();
        sandbox.replace(Math, 'random', () => 0.5);
    });

    test('retrieval and formatting of metadata', function() {
        var expected = {
            issue: 11698,
            rootReviewers: [ 'jgraham' ],
            filenames: [ 'WebIDL/interfaces.html', 'interfaces/WebIDL.idl' ],
            filenamesIgnoreRemoved: [ 'WebIDL/interfaces.html', 'interfaces/WebIDL.idl' ],
            paths: [ 'WebIDL', 'interfaces' ],
            labels: [ 'WebIDL', 'interfaces', 'wg-webplatform' ],
            isRoot: false,
            isReviewable: false,
            specs: {
                WebIDL: {
                    authors: [
                        'Cameron McCormack',
                        'Boris Zbarsky',
                        'Tobie Langel'
                    ],
                    href: 'https://heycam.github.io/webidl/',
                    title: 'Web IDL',
                    status: 'ED',
                    publisher: 'W3C',
                    edDraft: 'https://heycam.github.io/webidl/',
                    deliveredBy: [
                        {
                            shortname: 'webplatform',
                            url: 'https://www.w3.org/WebPlatform/WG/'
                        }
                    ],
                    versions: [
                        'WebIDL-20161215',
                        'WebIDL-20160915',
                        'WebIDL-20160308',
                        'WebIDL-20150804',
                        'WebIDL-20120419',
                        'WebIDL-20120207',
                        'WebIDL-20110927',
                        'WebIDL-20110712',
                        'WebIDL-20101021',
                        'WebIDL-20081219',
                        'WebIDL-20080829',
                        'WebIDL-20080410',
                        'WebIDL-20071017'
                    ],
                    repository: 'https://github.com/heycam/webidl',
                    id: 'WebIDL',
                    date: '15 December 2016'
                }
            },
            workingGroups: [ 'webplatform' ],
            owners: [
               { login: 'yuki3', permission: 'write' },
               { login: 'tobie', permission: 'write' },
               { login: 'jensl', permission: 'write' },
               { login: 'domenic', permission: 'write' }
            ],
            author: { login: 'lukebjerring', permission: 'write', isOwner: false },
            reviewersExcludingAuthor: [
               { login: 'yuki3', permission: 'write' },
               { login: 'tobie', permission: 'write' },
               { login: 'jensl', permission: 'write' },
               { login: 'domenic', permission: 'write' }
            ],
            reviewers: [ 'domenic', 'jensl', 'ms2ger', 'tobie', 'yuki3' ],
            isMergeable: true,
            reviewedDownstream: false,
            missingAssignee: 'Ms2ger',
            missingReviewers: [],
        };

        return getMetadata(11698, 'lukebjerring', '')
            .then(function(actual) {
                assert.deepEqual(expected, actual);
            });
    });

    teardown(() => {
        sandbox.restore();
    });
});
