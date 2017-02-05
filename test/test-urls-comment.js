var assert = require('assert'),
    testUrlComment = require('../lib/test-urls-comment');
    
    var NOT_COLLABORATOR = "These tests will be available on [w3c-test.org](https://w3c-test.org/submissions/1234/) as soon as they are approved by a repository collaborator.";
    var COLLABORATOR = "These tests will be available shortly on [w3c-test.org](https://w3c-test.org/submissions/1234/).";

suite('Test testUrlComments', function() {
    test('PR is not from a collaborator', function() {
        assert.equal(NOT_COLLABORATOR, testUrlComment(1234, {
            authorIsCollaborator: false,
            testUrls: []
        }));
    });
    
    test('PR is not from a collaborator and authorIsCollaborator is missing', function() {
        assert.equal(NOT_COLLABORATOR, testUrlComment(1234, {
            testUrls: []
        }));
    });
    
    test('PR is from a collaborator with no specific urls', function() {
        assert.equal(COLLABORATOR, testUrlComment(1234, {
            authorIsCollaborator: true,
            testUrls: []
        }));
    });
    
    test('PR is from a collaborator with specific urls', function() {
        var list = "";
        list += "\n* [foo/bar.HTML](https://w3c-test.org/submissions/1234/foo/bar.HTML)",
        list += "\n* [some/path/file.html](https://w3c-test.org/submissions/1234/some/path/file.html)",
        list += "\n* [main.HTM](https://w3c-test.org/submissions/1234/main.HTM)"
        assert.equal(COLLABORATOR + "\n\n" + list, testUrlComment(1234, {
            authorIsCollaborator: true,
            testUrls: [
                "https://w3c-test.org/submissions/1234/foo/bar.HTML",
                "https://w3c-test.org/submissions/1234/some/path/file.html",
                "https://w3c-test.org/submissions/1234/main.HTM"
            ]
        }));
    });
});