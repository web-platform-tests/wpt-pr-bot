"use strict";
var token = process.env.GITHUB_TOKEN;
var repo = "wpt";
var owner = "web-platform-tests";
const fetch = require('node-fetch'),
      logger = require('./logger');

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
        "User-Agent": "ganesh"
    };
}

async function post(url, body, options) {
    return _post("POST", url, body, options);
}

async function put(url, body, options) {
    return _post("PUT", url, body, options);
}

async function patch(url, body, options) {
    return _post("PATCH", url, body, options);
}

async function _post(method, url, body, options) {
    options = mergeOptions(options || {});
    url = replaceURL(baseURL(url), options);
    body = typeof body == "string" ? body : JSON.stringify(body);
    logger.debug(method + " " + url + "\n" + body);
    const response = await fetch(url, {
        method: method,
        headers: getHeaders(),
        body: body,
    });
    const responseBody = await response.text();
    if (response.status < 200 || response.status >= 300) {
        throw errFrom(response, responseBody);
    }
    // Legacy behavior; we handle an empty body in the return. Unclear if
    // this ever happens from real GitHub APIs, but dozens to hundreds of
    // integration test files have empty responses...
    return JSON.parse(responseBody || "null");
}

async function get(url, options) {
    options = mergeOptions(options || {});
    url = replaceURL(baseURL(url), options);
    var headers = getHeaders();
    logger.debug("GET", url);

    var output = [];
    while (true) {
        const response = await fetch(url, { headers: headers });
        let body = await response.text();
        if (response.status < 200 || response.status >= 300) {
            throw errFrom(response, body);
        }
        // Legacy behavior; we handle an empty body in the return. Unclear if
        // this ever happens from real GitHub APIs, but dozens to hundreds of
        // integration test files have empty responses...
        body = JSON.parse(body || "null");

        // Handle pagination.
        let link = response.headers.get('Link');
        if (link != null) {
            output.push.apply(output, body);
            link = parseLink(link);
            if (!link.next) {
                break;
            }
            url = link.next;
        } else {
            // Legacy behavior; when an API is paginated, we return an array of
            // json objects (output), but when the API is not paginated we just
            // return the sole json object not in an array.
            return body;
        }
    }

    return output;
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

function setToken(t) {
    token = t;
}

exports.get = get;
exports.post = post;
exports.put = put;
exports.patch = patch;
exports.setToken = setToken;
