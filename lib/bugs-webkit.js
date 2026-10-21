"use strict";
var token = process.env.WEBKIT_BUGZILLA_TOKEN;
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
        "User-Agent": "ganesh",
    };
}

// Bugzilla 5.0 only reads credentials from request parameters, not headers.
function withAuth(url) {
    if (!token) {
        return url;
    }
    const authed = new URL(url);
    authed.searchParams.set('Bugzilla_api_key', token);
    return authed.href;
}

// Redacts the API key from a URL, or from text containing URLs (e.g. error messages).
function redactAuth(text) {
    return text.replace(/([?&]Bugzilla_api_key=)[^&#\s]*/g, '$1REDACTED');
}

async function get(url, options) {
    url = replaceURL(baseURL(url), options);
    const headers = getHeaders();
    url = withAuth(url);
    logger.debug("GET", redactAuth(url));
    try {
        const response = await fetch(url, { headers: headers });
        if (response.status < 200 || response.status >= 300) {
            const bodyText = await response.text();
            throw errFrom(response, bodyText);
        }
        return await response.json();
    } catch (err) {
        // node-fetch includes the request URL, and so the API key, in its messages.
        if (err instanceof fetch.FetchError) {
            throw new fetch.FetchError(redactAuth(err.message), err.type, err);
        }
        throw err;
    }
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
