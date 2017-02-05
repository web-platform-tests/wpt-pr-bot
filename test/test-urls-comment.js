var assert = require('assert'),
    testUrlComment = require('../lib/test-urls-comment');
    
    var UNSAFE = "**This PR contains files which aren't whitelisted. Proceed with caution.**";
    var SAFE_INTRO = "These tests will be available shortly on [w3c-test.org](https://w3c-test.org/submissions/1234/).";
    var SAFE_OUTRO = "w3c-test:do-not-mirror *([What's this?](https://github.com/w3c/web-platform-tests/blob/master/README.md#publication))*";

suite('Test testUrlComments', function() {
    test('unsafe', function() {
        assert.equal(UNSAFE, testUrlComment(1234, {
            isSafe: false
        }));
    });
    
    test('unsafe with no isSafe info', function() {
        assert.equal(UNSAFE, testUrlComment(1234, {}));
    });
    
    test('safe with no specific urls', function() {
        assert.equal(SAFE_INTRO + "\n\n" + SAFE_OUTRO, testUrlComment(1234, {
            isSafe: true,
            testUrls: []
        }));
    });
    
    test('safe with specific urls', function() {
        var list = "";
        list += "\n* [foo/bar.HTML](https://w3c-test.org/submissions/1234/foo/bar.HTML)",
        list += "\n* [some/path/file.html](https://w3c-test.org/submissions/1234/some/path/file.html)",
        list += "\n* [main.HTM](https://w3c-test.org/submissions/1234/main.HTM)"
        assert.equal(SAFE_INTRO + "\n\n" + list + "\n\n" + SAFE_OUTRO, testUrlComment(1234, {
            isSafe: true,
            testUrls: [
                "https://w3c-test.org/submissions/1234/foo/bar.HTML",
                "https://w3c-test.org/submissions/1234/some/path/file.html",
                "https://w3c-test.org/submissions/1234/main.HTM"
            ]
        }));
    });
});