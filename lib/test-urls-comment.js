"use strict";
var BASE_TEST_URL = "https://w3c-test.org/submissions/";

module.exports = function(number, metadata) {
    if (!metadata.isSafe) {
        return "**This PR contains files which aren't whitelisted. Proceed with caution.**"
    }
    var body = "These tests will be available shortly on [w3c-test.org](" + BASE_TEST_URL + number + ").";
    if (metadata.testUrls.length) {
        body += "\n\n" + metadata.testUrls.map(function(url) {
            return "\n* [" + url.replace(BASE_TEST_URL + number + "/", "") +  "](" + url + ")";
        }).join("");
    }
    body += "\n\nw3c-test:do-not-mirror *([What's this?](https://github.com/w3c/web-platform-tests/blob/master/README.md#publication))*";
    return body;
};