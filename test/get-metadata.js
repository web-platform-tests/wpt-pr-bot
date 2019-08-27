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

    test('reviewer whose handle includes a capital letter', function() {
        var expected = {
          author: {
            isOwner: true,
            login: "ewilligers",
            permission: "write",
          },
          filenames: [
            "svg/coordinate-systems/inheritance.svg",
            "svg/coordinate-systems/parsing/vector-effect-computed.svg",
            "svg/coordinate-systems/parsing/vector-effect-invalid.svg",
            "svg/coordinate-systems/parsing/vector-effect-valid.svg",
          ],
          filenamesIgnoreRemoved: [
            "svg/coordinate-systems/inheritance.svg",
            "svg/coordinate-systems/parsing/vector-effect-computed.svg",
            "svg/coordinate-systems/parsing/vector-effect-invalid.svg",
            "svg/coordinate-systems/parsing/vector-effect-valid.svg",
          ],
          isMergeable: true,
          isReviewable: false,
          isRoot: false,
          issue: 18353,
          labels: [
            "svg",
            "wg-svg",
          ],
          missingAssignee: null,
          missingReviewers: [],
          owners: [
            {
              login: "svgeesus",
              permission: "write"
            },
            {
              login: "nikosandronikos",
              permission: "write"
            },
            {
              login: "ewilligers",
              permission: "write"
            },
            {
              login: "AmeliaBR",
              permission: "write"
            }
          ],
          paths: [
            "svg/coordinate-systems",
            "svg/coordinate-systems/parsing",
          ],
          reviewedDownstream: false,
          reviewers: [
            "ameliabr",
            "ewilligers",
            "nikosandronikos",
            "svgeesus",
          ],
          reviewersExcludingAuthor: [
            {
              login: "svgeesus",
              permission: "write"
            },
            {
              login: "nikosandronikos",
              permission: "write"
            },
            {
              login: "AmeliaBR",
              permission: "write"
            }
          ],
          reviews: [
            {
              _links: {
                html: {
                  href: "https://github.com/web-platform-tests/wpt/pull/18353#pullrequestreview-276294934",
                },
                pull_request: {
                  href: "https://api.github.com/repos/web-platform-tests/wpt/pulls/18353",
                },
              },
              author_association: "MEMBER",
              body: "These tests correctly reflect the grammar as it is currently written in the spec. But, that grammar is logically incorrect.\r\n\r\nSee https://github.com/w3c/svgwg/issues/725, and maybe delay merging until that is resolved.",
              commit_id: "256bdd5865650e4558d4d36c48270476dc27880c",
              html_url: "https://github.com/web-platform-tests/wpt/pull/18353#pullrequestreview-276294934",
              id: 276294934,
              node_id: "MDE3OlB1bGxSZXF1ZXN0UmV2aWV3Mjc2Mjk0OTM0",
              pull_request_url: "https://api.github.com/repos/web-platform-tests/wpt/pulls/18353",
              state: "COMMENTED",
              submitted_at: "2019-08-18T20:55:43Z",
              user: {
                avatar_url: "https://avatars2.githubusercontent.com/u/9876129?v=4",
                events_url: "https://api.github.com/users/AmeliaBR/events{/privacy}",
                followers_url: "https://api.github.com/users/AmeliaBR/followers",
                following_url: "https://api.github.com/users/AmeliaBR/following{/other_user}",
                gists_url: "https://api.github.com/users/AmeliaBR/gists{/gist_id}",
                gravatar_id: "",
                html_url: "https://github.com/AmeliaBR",
                id: 9876129,
                login: "AmeliaBR",
                node_id: "MDQ6VXNlcjk4NzYxMjk=",
                organizations_url: "https://api.github.com/users/AmeliaBR/orgs",
                received_events_url: "https://api.github.com/users/AmeliaBR/received_events",
                repos_url: "https://api.github.com/users/AmeliaBR/repos",
                site_admin: false,
                starred_url: "https://api.github.com/users/AmeliaBR/starred{/owner}{/repo}",
                subscriptions_url: "https://api.github.com/users/AmeliaBR/subscriptions",
                type: "User",
                url: "https://api.github.com/users/AmeliaBR",
              },
            },
            {
              _links: {
                html: {
                  href: "https://github.com/web-platform-tests/wpt/pull/18353#pullrequestreview-276296533",
                },
                pull_request: {
                  href: "https://api.github.com/repos/web-platform-tests/wpt/pulls/18353",
                },
              },
              author_association: "MEMBER",
              body: "",
              commit_id: "256bdd5865650e4558d4d36c48270476dc27880c",
              html_url: "https://github.com/web-platform-tests/wpt/pull/18353#pullrequestreview-276296533",
              id: 276296533,
              node_id: "MDE3OlB1bGxSZXF1ZXN0UmV2aWV3Mjc2Mjk2NTMz",
              pull_request_url: "https://api.github.com/repos/web-platform-tests/wpt/pulls/18353",
              state: "COMMENTED",
              submitted_at: "2019-08-18T21:26:18Z",
              user: {
                avatar_url: "https://avatars1.githubusercontent.com/u/929206?v=4",
                events_url: "https://api.github.com/users/ewilligers/events{/privacy}",
                followers_url: "https://api.github.com/users/ewilligers/followers",
                following_url: "https://api.github.com/users/ewilligers/following{/other_user}",
                gists_url: "https://api.github.com/users/ewilligers/gists{/gist_id}",
                gravatar_id: "",
                html_url: "https://github.com/ewilligers",
                id: 929206,
                login: "ewilligers",
                node_id: "MDQ6VXNlcjkyOTIwNg==",
                organizations_url: "https://api.github.com/users/ewilligers/orgs",
                received_events_url: "https://api.github.com/users/ewilligers/received_events",
                repos_url: "https://api.github.com/users/ewilligers/repos",
                site_admin: false,
                starred_url: "https://api.github.com/users/ewilligers/starred{/owner}{/repo}",
                subscriptions_url: "https://api.github.com/users/ewilligers/subscriptions",
                type: "User",
                url: "https://api.github.com/users/ewilligers",
              },
            },
            {
              _links: {
                html: {
                  href: "https://github.com/web-platform-tests/wpt/pull/18353#pullrequestreview-276297954",
                },
                pull_request: {
                  href: "https://api.github.com/repos/web-platform-tests/wpt/pulls/18353",
                },
              },
              author_association: "MEMBER",
              body: "",
              commit_id: "256bdd5865650e4558d4d36c48270476dc27880c",
              html_url: "https://github.com/web-platform-tests/wpt/pull/18353#pullrequestreview-276297954",
              id: 276297954,
              node_id: "MDE3OlB1bGxSZXF1ZXN0UmV2aWV3Mjc2Mjk3OTU0",
              pull_request_url: "https://api.github.com/repos/web-platform-tests/wpt/pulls/18353",
              state: "COMMENTED",
              submitted_at: "2019-08-18T22:09:56Z",
              user: {
                avatar_url: "https://avatars2.githubusercontent.com/u/9876129?v=4",
                events_url: "https://api.github.com/users/AmeliaBR/events{/privacy}",
                followers_url: "https://api.github.com/users/AmeliaBR/followers",
                following_url: "https://api.github.com/users/AmeliaBR/following{/other_user}",
                gists_url: "https://api.github.com/users/AmeliaBR/gists{/gist_id}",
                gravatar_id: "",
                html_url: "https://github.com/AmeliaBR",
                id: 9876129,
                login: "AmeliaBR",
                node_id: "MDQ6VXNlcjk4NzYxMjk=",
                organizations_url: "https://api.github.com/users/AmeliaBR/orgs",
                received_events_url: "https://api.github.com/users/AmeliaBR/received_events",
                repos_url: "https://api.github.com/users/AmeliaBR/repos",
                site_admin: false,
                starred_url: "https://api.github.com/users/AmeliaBR/starred{/owner}{/repo}",
                subscriptions_url: "https://api.github.com/users/AmeliaBR/subscriptions",
                type: "User",
                url: "https://api.github.com/users/AmeliaBR",
              },
            },
          ],
          rootReviewers: [
            "jgraham",
          ],
          specs: {
            svg: {
              authors: [
                "Jon Ferraiolo",
              ],
              date: "4 September 2001",
              deliveredBy: [
                {
                  shortname: "svg",
                  url: "https://www.w3.org/Graphics/SVG/WG/",
                },
              ],
              href: "https://www.w3.org/TR/SVG/",
              id: "SVG",
              obsoletedBy: [
                "SVG11",
              ],
              publisher: "W3C",
              status: "REC",
              title: "Scalable Vector Graphics (SVG) 1.0 Specification",
              versions: [
                "SVG-20010904",
                "SVG-20010719",
                "SVG-20001102",
                "SVG-20000802",
                "SVG-20000629",
                "SVG-20000303",
                "SVG-19991203",
                "SVG-19990812",
                "SVG-19990730",
                "SVG-19990706",
                "SVG-19990625",
                "SVG-19990412",
                "SVG-19990211",
              ],
            },
          },
          workingGroups: [
            "svg",
          ]
        };

        return getMetadata(18353, 'ewilligers', '')
            .then(function(actual) {
                assert.deepEqual(expected, actual);
            });
    });

    teardown(() => {
        sandbox.restore();
    });
});
