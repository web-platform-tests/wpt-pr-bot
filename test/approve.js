'use strict';

var assert = require('chai').assert,
    approve = require('../lib/approve');

suite('approve', function() {
    test('submits review for pull request with zero reviews', function() {
        // This issue number does not describe a GitHub pull request. The
        // corresponding fixture data has been manually altered to simulate
        // expected interation with GitHub.com
        return approve(13976, 'I felt like it')
            .then(function(result) {
                assert.equal(result, true);
            });
    });

    test('does not submit review multiple times', function() {
        return approve(13990, 'I felt like it')
            .then(function(result) {
                assert.equal(result, false);
            });
    });
});
