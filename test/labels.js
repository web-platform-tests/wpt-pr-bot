var assert = require('chai').assert,
    labels = require('../lib/metadata/labels');

suite('labels', function() {
    suite('fromFiles', function() {
        test('must return root dir of filename as label', function() {
            assert.sameMembers(["foo"], labels.fromFiles(["foo/bar/baz"]));
        });

        test('must return correct shortname of spec for directories which used to be spelled incorrectly', function() {
            assert.sameMembers(["shadow-dom"], labels.fromFiles(["ShadowDOM/file.html"]));
        });

        test('must return "infra" for content identified as such', function() {
            assert.sameMembers(["infra"], labels.fromFiles([".gitignore"]));
        });

        test('must return "infra" for rootdir files', function() {
            assert.sameMembers(["infra"], labels.fromFiles(["some-file-in-root-dir.html"]));
        });

        test('must return value of sub directory for css specs', function() {
            assert.sameMembers(["css-align-3"], labels.fromFiles(["css/css-align-3/some-weird/path.html"]));
        });

        test('must return value of sub directory for tools', function() {
            assert.sameMembers(
                ["infra", "lint"],
                labels.fromFiles(["tools/lint/tests/base.py"])
            );
        });

        test('must return label to designate CSS build system', function() {
            assert.sameMembers(
                ['infra', "css"],
                labels.fromFiles(["css/tools/foo/bar"])
            );
        });

        test('must return label to designate testharness.js changes', function() {
            assert.sameMembers(
                ['infra', 'testharness.js'],
                labels.fromFiles(['resources/testharness.js.headers'])
            );
            assert.sameMembers(
                ['infra', 'testharness.js'],
                labels.fromFiles(['resources/testharnessreport.js.headers'])
            );
            assert.sameMembers(
                ['infra', 'testharness.js'],
                labels.fromFiles(['resources/test/tests/functional/order.html'])
            );
        });

        test('must return label to designate testdriver.js changes', function() {
            assert.sameMembers(
                ['infra', 'testdriver.js'],
                labels.fromFiles(['resources/testdriver.js'])
            );
            assert.sameMembers(
                ['infra', 'testdriver.js'],
                labels.fromFiles(['resources/testdriver-vendor.js.headers'])
            );
        });

        test('must return label to designate idlharness changes', function() {
            assert.sameMembers(
                ['infra', 'idlharness.js'],
                labels.fromFiles(['resources/idlharness.js'])
            );
            assert.sameMembers(
                ['infra', 'idlharness.js'],
                labels.fromFiles(['resources/idlharness.js.headers'])
            );
            assert.sameMembers(
                ['infra', 'idlharness.js'],
                labels.fromFiles(['resources/webidl2/foo'])
            );
        });

        test('must never return an empty string', function() {
            assert.sameMembers([], labels.fromFiles([""]));
        });

        test('must not return duplicates', function() {
            assert.sameMembers(["html"], labels.fromFiles(["html/some/path/to/file.html", "html/some/other/path/to/file.html"]));
        });
    });
});
