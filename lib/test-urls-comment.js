"use strict";
var BASE_TEST_URL = "https://w3c-test.org/submissions/";
var UNSAFE_MESSAGE = "**This PR contains files which aren't whitelisted. Proceed with caution.**";

module.exports = function(number, metadata) {
    if (!metadata.isSafe) {
        return UNSAFE_MESSAGE;
    }
    var body = "These tests will be available shortly on [w3c-test.org](" + BASE_TEST_URL + number + "/).";
    if (metadata.testUrls.length) {
        body += "\n\n" + metadata.testUrls.map(function(url) {
            return "\n* [" + url.replace(BASE_TEST_URL + number + "/", "") +  "](" + url + ")";
        }).join("");
    }
    return body;
};

module.exports.UNSAFE_MESSAGE = UNSAFE_MESSAGE;