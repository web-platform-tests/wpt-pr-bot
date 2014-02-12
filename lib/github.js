"use strict";
var token = process.env.GITHUB_TOKEN;
var repo = "web-platform-tests";
var owner = "w3c";
var request = require('request'),
    q = require('q');

function errFrom(body) {
    body = JSON.parse(body);
    var err = new Error(body.message);
    if (body.errors) { err.errors = body.errors; }
    return err;
}

function getHeaders() {
    return {
        "Authorization": "token " + token,
        "User-Agent": "ganesh"
    };
}

function post(url, body, options) {
    options = mergeOptions(options || {});
    url = replaceURL(baseURL(url), options);
    var deferred = q.defer();
    request.post({
        url: url,
        headers: getHeaders(),
        body: typeof body == "string" ? body : JSON.stringify(body)
    }, function(err, response, body) {
        if (err) {
            deferred.reject(err);
        } else if (response.statusCode == 200) {
            deferred.resolve(JSON.parse(body));
        } else {
            deferred.reject(errFrom(body));
        }
    });
    return deferred.promise;
}

function get(url, options) {
    options = mergeOptions(options || {});
    url = replaceURL(baseURL(url), options);
    var headers = getHeaders();
    var output = [];
    var deferred = q.defer();
    function onResponse(err, response, body) {
        if (err) {
            deferred.reject(err);
        } else if (response.statusCode == 200) {
            var link = response.headers.link;
	    body = JSON.parse(body);
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
            deferred.reject(errFrom(body, url));
        }
    }
    request.get({
        url: url,
        headers: headers
    }, onResponse);
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