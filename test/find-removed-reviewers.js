var assert = require('assert'),
    findRemovedReviewers = require('../lib/metadata/find-removed-reviewers');

suite('integration', function() {
    var number = "11512";
    test('directory contains file', function() {
        return findRemovedReviewers(number)
          .then(function(reviewers) {
              reviewers.sort();

              assert.deepEqual(reviewers, [ 'zcorpan' ]);
          });
    });
});
