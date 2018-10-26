"use strict";
var token = process.env.GITHUB_TOKEN;
var repo = "wpt";
var owner = "web-platform-tests";
var request = require('request'),
    q = require('q');

var retry = require('./retry');

var RETRY_DELAY = 10 * 1000;

function errFrom(response, body) {
    body = JSON.parse(body);
    var err = new Error(body.message);
    if (body.errors) { err.errors = body.errors; }
    err.statusCode = response.statusCode;
    return err;
}

function getHeaders() {
    return {
        "Authorization": "token " + token,
        "User-Agent": "ganesh",
        "Accept": "application/vnd.github.black-cat-preview+json"
    };
}

// The GitHub.com API occasionally responds to requests with 404 errors,
// although the requested resources become available after some delay. Attempt
// to recover from these errors by retrying failed requests up to two
// additional times.
//
// https://github.com/web-platform-tests/wpt-pr-bot/issues/48
var requestWithRetry = retry({
    maxAttempts: 2,
    action: function(params) {
        var deferred = q.defer();

        request(params, function(err, response, body) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve({ response: response, body: body });
            }
        });

        return deferred.promise;
    },
    when: function(result) {
        if (result.response.statusCode === 404) {
            console.log(
                'Received 404. Retrying in ' + RETRY_DELAY + ' milliseconds.'
            );

            return q.delay(true, RETRY_DELAY);
        }

        return false;
    }
});

function post(url, body, options) {
    return _post("POST", url, body, options);
}

function put(url, body, options) {
    return _post("PUT", url, body, options);
}

function patch(url, body, options) {
    return _post("PATCH", url, body, options);
}

function _post(method, url, body, options) {
    options = mergeOptions(options || {});
    url = replaceURL(baseURL(url), options);
    body = typeof body == "string" ? body : JSON.stringify(body);
    console.log(method + " " + url + "\n" + body);
    return requestWithRetry({
        method: method,
        url: url,
        headers: getHeaders(),
        body: body
    }).then(function(result) {
        var response = result.response;
        var body = result.body;

        if (response.statusCode >= 200 && response.statusCode < 300) {
            return JSON.parse(body || "null");
        } else {
            throw errFrom(response, body);
        }
    });
}

function get(url, options) {
    options = mergeOptions(options || {});
    url = replaceURL(baseURL(url), options);
    var headers = getHeaders();
    var output = [];
    var deferred = q.defer();
    function onResponse(result) {
        var response = result.response;
        var body = result.body;

        if (response.statusCode >= 200 && response.statusCode < 300) {
            var link = response.headers.link;
            body = JSON.parse(body || "null");
            if (link) {
                output.push.apply(output, body);
                link = parseLink(link);
                if (link.next) {
                    requestWithRetry({
                        method: "GET",
                        url: link.next,
                        headers: headers
                    })
                        .then(onResponse)
                        .catch(deferred.reject);
                    deferred.notify(body);
                } else {
                    deferred.notify(body);
                    deferred.resolve(output);
                }
            } else {
                deferred.resolve(body);
            }
        } else {
            deferred.reject(errFrom(response, body));
        }
    }
    console.log("GET", url);
    requestWithRetry({
        method: "GET",
        url: url,
        headers: headers
    })
        .then(onResponse)
        .catch(deferred.reject);

    return deferred.promise;
}

function parseLink(str) {
    var output = {};
    (str || '').split(',').forEach(function(pair) {
        pair = pair.match(/<([^>]+)>; rel="([^"]+)"/);
        output[pair[2]] = pair[1];
    });
    return output;
}

function mergeOptions(options) {
    var output = {
        repo: repo,
        owner: owner
    };
    options = options || {};
    for (var k in options) {
        output[k] = options[k];
    }
    return output;
}

function baseURL(url) {
    var base = 'https://api.github.com';
    url = url || '';
    return base + url.replace(base, '');
}

function replaceURL(url, options) {
    return url.replace(/:([a-z-_]+)/gi, function(m, m1) {
        return options[m1];
    });
}

exports.get = get;
exports.post = post;
exports.put = put;
exports.patch = patch;
