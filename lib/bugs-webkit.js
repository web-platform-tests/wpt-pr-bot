"use strict";
var token = process.env.WEBKIT_BUGZILLA_TOKEN;
var request = require('request'),
    q = require('q');

function errFrom(response, body) {
    body = JSON.parse(body);
    var err = new Error(body.message);
    if (body.errors) { err.errors = body.errors; }
    err.statusCode = response.statusCode;
    return err;
}

function getHeaders() {
    return {
        "User-Agent": "ganesh",
		"X-BUGZILLA-TOKEN": token,
    };
}

function get(url, options) {
    url = replaceURL(baseURL(url), options);
    var headers = getHeaders();
    var deferred = q.defer();
    function onResponse(err, response, body) {
        if (err) {
            deferred.reject(err);
        } else if (response.statusCode >= 200 && response.statusCode < 300) {
            body = JSON.parse(body || "null");
            deferred.resolve(body);
        } else {
            deferred.reject(errFrom(response, body));
        }
    }
    console.log("GET", url);
    request.get({
        url: url,
        headers: headers
    }, onResponse);
    return deferred.promise;
}

function baseURL(url) {
    var base = 'https://bugs.webkit.org';
    url = url || '';
    return base + url.replace(base, '');
}

function replaceURL(url, options) {
    return url.replace(/:([a-z-_]+)/gi, function(m, m1) {
        return options[m1];
    });
}

function setToken(t) {
    token = t;
}

exports.get = get;
exports.setToken = setToken;
