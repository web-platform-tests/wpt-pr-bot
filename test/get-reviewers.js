var assert = require('assert'),
    getReviewers = require('../lib/get-reviewers');

suite('Test get-reviewers', function() {
    test('getReviewers for simple, initial case', function() {
        assert.deepEqual(["bar", "foobar"], getReviewers({
            author: { login: "foo" },
            reviewers: [],
            ownersExcludingAuthor: [{ login: "bar" }, { login: "foobar" }],
            isRoot: false,
            rootReviewers: ["jgraham"]
        }).sort());
    });
    
    test('getReviewers for simple, initial case, with pre-existing reviewers', function() {
        assert.deepEqual(["bar", "foobar"], getReviewers({
            author: { login: "foo" },
            reviewers: ["extra"],
            ownersExcludingAuthor: [{ login: "bar" }, { login: "foobar" }],
            isRoot: false,
            rootReviewers: ["jgraham"]
        }).sort());
    });
    
    test('getReviewers for simple, initial case, with pre-existing reviewer that is an owner', function() {
        assert.deepEqual(["foobar"], getReviewers({
            author: { login: "foo" },
            reviewers: ["bar"],
            ownersExcludingAuthor: [{ login: "bar" }, { login: "foobar" }],
            isRoot: false,
            rootReviewers: ["jgraham"]
        }).sort());
    });
    
    test('getReviewers for simple case, follow-up', function() {
        assert.deepEqual([], getReviewers({
            author: { login: "foo" },
            reviewers: ["foobar", "bar"],
            ownersExcludingAuthor: [{ login: "bar" }, { login: "foobar" }],
            isRoot: false,
            rootReviewers: ["jgraham"]
        }).sort());
    });
    
    test('getReviewers for simple case, follow-up, with manually added reviewers', function() {
        assert.deepEqual([], getReviewers({
            author: { login: "foo" },
            reviewers: ["foobar", "bar", "extra"],
            ownersExcludingAuthor: [{ login: "bar" }, { login: "foobar" }],
            isRoot: false,
            rootReviewers: ["jgraham"]
        }).sort());
    });
});

suite('Test get-reviewers w/ root', function() {
    test('getReviewers for simple, initial case', function() {
        assert.deepEqual(["bar", "foobar", "jgraham"], getReviewers({
            author: { login: "foo" },
            reviewers: [],
            ownersExcludingAuthor: [{ login: "bar" }, { login: "foobar" }],
            isRoot: true,
            rootReviewers: ["jgraham"]
        }).sort());
    });
    
    test('getReviewers for simple, initial case, with pre-existing reviewer that is a root owner', function() {
        assert.deepEqual(["bar", "foobar"], getReviewers({
            author: { login: "foo" },
            reviewers: ["jgraham"],
            ownersExcludingAuthor: [{ login: "bar" }, { login: "foobar" }],
            isRoot: true,
            rootReviewers: ["jgraham"]
        }).sort());
    });
    
    test('rootReviewer is also owner', function() {
        assert.deepEqual(["foobar", "jgraham"], getReviewers({
            author: { login: "foo" },
            reviewers: [],
            ownersExcludingAuthor: [{ login: "jgraham" }, { login: "foobar" }],
            isRoot: false,
            rootReviewers: ["jgraham"]
        }).sort());
    });
});