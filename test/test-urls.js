var assert = require('assert'),
    testUrls = require('../lib/metadata/test-urls');

suite('test-urls', function() {
    test('single test file', function() {
        assert.deepEqual(["https://w3c-test.org/submissions/45/foo/bar.html"], testUrls(45, ["foo/bar.html"]));
    });
    
    test('single test file with multiple support files', function() {
        assert.deepEqual(["https://w3c-test.org/submissions/45/foo/bar.html"], testUrls(45, [
            "foo/bar.html",
            "foo/bar.js",
            "foo/bar.css",
            "main.css",
        ]));
    });
    
    test('single test file with uppercase extension and multiple support files', function() {
        assert.deepEqual(["https://w3c-test.org/submissions/45/main.HTML"], testUrls(45, [
            "foo/bar.js",
            "foo/bar.css",
            "main.css",
            "main.HTML"
        ]));
    });
    
    test('multiple test files with different extensions and multiple support files', function() {
        assert.deepEqual([
            "https://w3c-test.org/submissions/2989/foo/bar.HTML",
            "https://w3c-test.org/submissions/2989/some/path/file.html",
            "https://w3c-test.org/submissions/2989/main.HTM"
        ], testUrls(2989, [
            "foo/bar.js",
            "foo/bar.HTML",
            "foo/bar.css",
            "main.css",
            "some/path/file.html",
            "main.HTM"
        ]));
    });
});
