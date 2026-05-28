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
