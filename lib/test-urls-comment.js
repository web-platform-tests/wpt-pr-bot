"use strict";
var BASE_TEST_URL = "https://w3c-test.org/submissions/";

module.exports = function(number, metadata) {
    var body = "";
    if (metadata.authorIsCollaborator) {
        body = "These tests will be available shortly on [w3c-test.org](" + BASE_TEST_URL + number + "/).";
    } else {
        body = "These tests will be available on [w3c-test.org](" + BASE_TEST_URL + number + "/) shortly after they are [approved](https://github.com/w3c/web-platform-tests/blob/master/README.md#publication) by a repository collaborator.";
    }
    if (metadata.testUrls.length) {
        body += "\n\n" + metadata.testUrls.map(function(url) {
            return "\n* [" + url.replace(BASE_TEST_URL + number + "/", "") +  "](" + url + ")";
        }).join("");
    }
    return body;
};
