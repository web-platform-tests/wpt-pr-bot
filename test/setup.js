'use strict';
var path = require('path');

var replay = require('replay');

replay.fixtures = path.join(__dirname, 'fixtures')

// Remove the "Authorization" header so the fixture data can be used in the
// absence of a valid API token.
replay.headers = replay.headers.filter(function(pattern) {
  return !pattern.test('authorization');
});
