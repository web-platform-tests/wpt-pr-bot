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
            reviews: [
              {
                _links: {
                  html: {
                    href: 'https://github.com/web-platform-tests/wpt/pull/11698#pullrequestreview-133189917'
                  },
                  pull_request: {
                    href: 'https://api.github.com/repos/web-platform-tests/wpt/pulls/11698'
                  }
                },
                author_association: 'MEMBER',
                body: '',
                commit_id: '9cb7c1ac9fc201f48b576a5c67e5da8eb83d876c',
                html_url: 'https://github.com/web-platform-tests/wpt/pull/11698#pullrequestreview-133189917',
                id: 133189917,
                node_id: 'MDE3OlB1bGxSZXF1ZXN0UmV2aWV3MTMzMTg5OTE3',
                pull_request_url: 'https://api.github.com/repos/web-platform-tests/wpt/pulls/11698',
                state: 'APPROVED',
                submitted_at: '2018-06-29T11:25:58Z',
                user: {
                  avatar_url: 'https://avatars1.githubusercontent.com/u/111161?v=4',
                  events_url: 'https://api.github.com/users/Ms2ger/events{/privacy}',
                  followers_url: 'https://api.github.com/users/Ms2ger/followers',
                  following_url: 'https://api.github.com/users/Ms2ger/following{/other_user}',
                  gists_url: 'https://api.github.com/users/Ms2ger/gists{/gist_id}',
                  gravatar_id: '',
                  html_url: 'https://github.com/Ms2ger',
                  id: 111161,
                  login: 'Ms2ger',
                  node_id: 'MDQ6VXNlcjExMTE2MQ==',
                  organizations_url: 'https://api.github.com/users/Ms2ger/orgs',
                  received_events_url: 'https://api.github.com/users/Ms2ger/received_events',
                  repos_url: 'https://api.github.com/users/Ms2ger/repos',
                  site_admin: false,
                  starred_url: 'https://api.github.com/users/Ms2ger/starred{/owner}{/repo}',
                  subscriptions_url: 'https://api.github.com/users/Ms2ger/subscriptions',
                  type: 'User',
                  url: 'https://api.github.com/users/Ms2ger'
                }
              }
            ],
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
