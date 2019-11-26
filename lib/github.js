"use strict";
var token = null;
var repo = "wpt";
var owner = "web-platform-tests";
var request = require('request'),
    q = require('q'),
    {Datastore} = require('@google-cloud/datastore');

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
    var deferred = q.defer();

    fetchTokenFromDatastore().then(() => {
        body = typeof body == "string" ? body : JSON.stringify(body);
        console.log(method + " " + url + "\n" + body);
        request[method.toLowerCase()]({
            url: url,
            headers: getHeaders(),
            body: body
        }, function(err, response, body) {
            if (err) {
                deferred.reject(err);
            } else if (response.statusCode >= 200 && response.statusCode < 300) {
                deferred.resolve(JSON.parse(body || "null"));
            } else {
                deferred.reject(errFrom(response, body));
            }
        });
    });
    return deferred.promise;
}

function get(url, options) {
    options = mergeOptions(options || {});
    url = replaceURL(baseURL(url), options);
    var deferred = q.defer();
    fetchTokenFromDatastore().then(() => {
        var headers = getHeaders();
        var output = [];
        function onResponse(err, response, body) {
            if (err) {
                deferred.reject(err);
            } else if (response.statusCode >= 200 && response.statusCode < 300) {
                var link = response.headers.link;
                body = JSON.parse(body || "null");
                if (link) {
                    output.push.apply(output, body);
                    link = parseLink(link);
                    if (link.next) {
                        request.get({
                            url: link.next,
                            headers: headers
                        }, onResponse);
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
        request.get({
            url: url,
            headers: headers
        }, onResponse);
    });
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

function fetchTokenFromDatastore() {
    if (token)
        return Promise.resolve();

    const datastore = new Datastore({projectId: 'wpt-pr-bot'});
    const key = datastore.key(['Token', 'wpt-pr-bot-github-token']);
    return datastore.get(key).then(entity => {
        token = entity[0].Secret;
    });
}

exports.get = get;
exports.post = post;
exports.put = put;
exports.patch = patch;
