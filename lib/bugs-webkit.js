"use strict";
var token = process.env.WEBKIT_BUGZILLA_TOKEN;
const fetch = require('node-fetch'),
      logger = require('./logger'),
      throttle = require('./throttle');

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

const MIN_DELAY_MS = 1000;

async function fetchOnce(url) {
    const headers = getHeaders();
    logger.debug("GET", url);
    const response = await fetch(url, { headers: headers });
    if (response.status < 200 || response.status >= 300) {
        const bodyText = await response.text();
        throw errFrom(response, bodyText);
    }
    return response.json();
}

const throttledFetch = throttle.serialize(fetchOnce, MIN_DELAY_MS);

async function get(url, options) {
    url = replaceURL(baseURL(url), options);
    return throttledFetch(url);
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
exports._throttledFetch = throttledFetch;
