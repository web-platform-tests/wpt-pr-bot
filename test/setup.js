'use strict';
var path = require('path');

const bunyan = require('bunyan'),
      logger = require('../lib/logger'),
      replay = require('replay'),
      sinon = require('sinon');

// Redirect all log output into a ring buffer so tests run quietly.
// On failure, the buffered records are written to stderr for debugging.
const ringBuffer = new bunyan.RingBuffer({ limit: 100 });
const originalStreams = logger.streams.slice();
logger.streams.length = 0;
logger.addStream({ type: 'raw', stream: ringBuffer, level: 'trace' });

function disableThrottle(throttledFetch) {
    let sandbox;
    suiteSetup(function() {
        sandbox = sinon.createSandbox();
        sandbox.stub(throttledFetch, 'minDelayMs').value(0);
    });
    suiteTeardown(function() {
        sandbox.restore();
    });
}

module.exports = { ringBuffer, disableThrottle };

teardown(function() {
    if (this.currentTest && this.currentTest.state === 'failed') {
        ringBuffer.records.forEach(function(r) {
            process.stderr.write(JSON.stringify(r) + '\n');
        });
    }
    ringBuffer.records = [];
});

suiteTeardown(function() {
    logger.streams.length = 0;
    originalStreams.forEach(function(s) {
        logger.addStream(s);
    });
});

replay.fixtures = path.join(__dirname, 'fixtures');

// Remove the "Authorization" header so the fixture data can be used in the
// absence of a valid API token.
replay.headers = replay.headers.filter(function(pattern) {
  return !pattern.test('authorization');
});

// The WebKit Bugzilla API key is sent as a query parameter. Fixtures only ever
// contain a placeholder key: the real key is replaced with it before a
// fixture is written to disk, and before a request is matched against
// fixtures. Tests in `replay` mode send the placeholder itself.
var API_KEY_PARAM = /([?&]Bugzilla_api_key=)[^&]*/;
var PLACEHOLDER_API_KEY = 'REDACTED';

if (replay.mode === 'replay') {
  require('../lib/bugs-webkit').setToken(PLACEHOLDER_API_KEY);
}

function redactRequest(request) {
  var redact = function(s) {
    return s && s.replace(API_KEY_PARAM, '$1' + PLACEHOLDER_API_KEY);
  };
  var url = Object.assign(Object.create(Object.getPrototypeOf(request.url)), request.url, {
    path: redact(request.url.path),
    href: redact(request.url.href),
    search: redact(request.url.search)
  });
  return Object.assign(Object.create(Object.getPrototypeOf(request)), request, { url: url });
}

var find = replay.catalog.find;
replay.catalog.find = function(host) {
  var matchers = find.call(this, host);
  return matchers && matchers.map(function(matcher) {
    return function(request) {
      return matcher(redactRequest(request));
    };
  });
};

var save = replay.catalog.save;
replay.catalog.save = function(host, request, response, callback) {
  return save.call(this, host, redactRequest(request), response, callback);
};
