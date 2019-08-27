var assert = require('assert'),
    getReviewers = require('../lib/metadata/get-reviewers');

suite('Test get-reviewers', function() {
    test('getReviewers for simple, initial case', function() {
        assert.deepEqual(["bar", "foobar"], getReviewers({
            author: { login: "foo" },
            reviewers: [],
            reviewersExcludingAuthor: [{ login: "bar" }, { login: "foobar" }],
            isRoot: false,
            rootReviewers: ["jgraham"]
        }).sort());
    });

    test('getReviewers for simple, initial case, with pre-existing reviewers', function() {
        assert.deepEqual(["bar", "foobar"], getReviewers({
            author: { login: "foo" },
            reviewers: ["extra"],
            reviewersExcludingAuthor: [{ login: "bar" }, { login: "foobar" }],
            isRoot: false,
            rootReviewers: ["jgraham"]
        }).sort());
    });

    test('getReviewers for simple, initial case, with pre-existing reviewer that is an owner', function() {
        assert.deepEqual(["foobar"], getReviewers({
            author: { login: "foo" },
            reviewers: ["bar"],
            reviewersExcludingAuthor: [{ login: "bar" }, { login: "foobar" }],
            isRoot: false,
            rootReviewers: ["jgraham"]
        }).sort());
    });

    test('getReviewers for simple case, follow-up', function() {
        assert.deepEqual([], getReviewers({
            author: { login: "foo" },
            reviewers: ["foobar", "bar"],
            reviewersExcludingAuthor: [{ login: "bar" }, { login: "foobar" }],
            isRoot: false,
            rootReviewers: ["jgraham"]
        }));
    });

    // In the context of the application, each item in the `reviewers` array is
    // converted to lower case, but the `login` property of each object in
    // `reviewersExcludingAuthor` is not.
    test('getReviewers for simple case, follow-up - case insensitive', function() {
        assert.deepEqual(["foobar"], getReviewers({
            author: { login: "foo" },
            reviewers: ["hasupper"],
            reviewersExcludingAuthor: [{ login: "HasUpper" }, { login: "foobar" }],
            isRoot: false,
            rootReviewers: ["jgraham"]
        }).sort());
    });

    test('getReviewers for simple case, follow-up, with manually added reviewers', function() {
        assert.deepEqual([], getReviewers({
            author: { login: "foo" },
            reviewers: ["foobar", "bar", "extra"],
            reviewersExcludingAuthor: [{ login: "bar" }, { login: "foobar" }],
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
            reviewersExcludingAuthor: [{ login: "bar" }, { login: "foobar" }],
            isRoot: true,
            rootReviewers: ["jgraham"]
        }).sort());
    });

    test('getReviewers for simple, initial case, with pre-existing reviewer that is a root owner', function() {
        assert.deepEqual(["bar", "foobar"], getReviewers({
            author: { login: "foo" },
            reviewers: ["jgraham"],
            reviewersExcludingAuthor: [{ login: "bar" }, { login: "foobar" }],
            isRoot: true,
            rootReviewers: ["jgraham"]
        }).sort());
    });

    test('rootReviewer is also owner', function() {
        assert.deepEqual(["foobar", "jgraham"], getReviewers({
            author: { login: "foo" },
            reviewers: [],
            reviewersExcludingAuthor: [{ login: "jgraham" }, { login: "foobar" }],
            isRoot: false,
            rootReviewers: ["jgraham"]
        }).sort());
    });
});
