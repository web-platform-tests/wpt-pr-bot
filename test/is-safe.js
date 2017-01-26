var assert = require('assert'),
    isSafe = require('../lib/metadata/is-safe');

suite('is-safe: single unsafe files is marked as unsafe', function() {
    test('no extension file', function() {
        assert(!isSafe(["foo"]))
    });
    
    test('no extension with long path', function() {
        assert(!isSafe(["foo/bar/baz"]))
    });
    
    test('no extension with long path and period in path', function() {
        assert(!isSafe(["foo/bar.html/baz"]))
    });
    
    test('tricky extensions', function() {
        assert(!isSafe(["foo.html."]))
    });
    
    test('tricky extensions', function() {
        assert(!isSafe([".html"]))
    });
    
    test('python extension', function() {
        assert(!isSafe(["foo.py"]))
    });
    
    test('python uppercase extension', function() {
        assert(!isSafe(["foo.PY"]))
    });
    
    
    test('made up extension', function() {
        assert(!isSafe(["foo.made-up-ext"]))
    });
});

suite('is-safe: multiple files with a file whose\'s extenion isn\'t whitelisted are marked as unsafe', function() {
    test('first file does not have a whitelisted extension', function() {
        assert(!isSafe(["foo", "foo.js"]))
    });
    
    test('first file does not have a whitelisted extension (out of three files)', function() {
        assert(!isSafe(["foo.py", "foo.js", "bar.html"]))
    });
    
    test('last file does not have a whitelisted extension', function() {
        assert(!isSafe(["bar/foo.html", "foo.js", "bar.py"]))
    });
});

suite('is-safe: marked as safe when all files have whitelisted extensions', function() {
    test('both files have whitelisted extensions', function() {
        assert(isSafe(["foo.html", "foo.js"]))
    });
    
    test('all three files have whitelisted extensions', function() {
        assert(isSafe(["foo.html", "foo.js", "foo.HTM"]))
    });
    
    test('mixed case extensions', function() {
        assert(isSafe(["bar/foo.HTML", "foo.js", "bar.png"]))
    });
});

suite('is-safe: special cases', function() {
    test('no file should be marked a safe', function() {
        assert(isSafe([]))
    });
    
    test('single file with whitelisted extension should be marked as safe', function() {
        assert(isSafe(["foo.html"]))
    });
    
    test('single file with whitelisted uppercase extension should be marked as safe', function() {
        assert(isSafe(["foo.PNG"]))
    });
});

