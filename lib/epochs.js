"use strict";

var github = require('./github'),
    request = require('request'),
    q = require('q');

function updateEpoch(epoch) {
    // Trust fresh GET from epochs API to deliver latest hash.
    var deferred = q.defer();
    request.get('https://wpt.fyi/api/revisions/latest', function (err, response, body) {
        if (err) {
            deferred.reject(err);
            return;
        }
        if (response.statusCode < 200 || response.statusCode >= 300) {
            deferred.reject(new Error("Bad status code from epochs API: " +
                response.statusCode));
            return;
        }
        body = JSON.parse(body || "null");
        if (!body) {
            deferred.reject(new Error("Falsey epochs API response body"));
            return;
        }
        if (!body.revisions) {
            deferred.reject(new Error("Epochs API body missing 'revisions' key"));
            return;
        }
        if (!body.revisions[epoch]) {
            deferred.reject(new Error("Epochs API body missing 'revisions.[epoch]' key"));
            return;
        }
        if (!body.revisions[epoch].hash) {
            deferred.reject(new Error("Epochs API body missing 'revisions.[epoch].hash"));
            return;
        }
        deferred.resolve(body.revisions[epoch].hash);
    });

    // Update epochs/[epoch] branch ref iff it has changed.
    var ref = 'heads/epochs/' + epoch;
    return deferred.promise.then(function (next) {
        return github.get('/repos/:owner/:repo/git/refs/:ref', {
            ref: ref
        }).then(function (body) {
            if (!body) {
                throw new Error("Falsey get ref response body");
            }
            if (!body.object) {
                throw new Error("Get ref response body missing 'object' key");
            }
            if (!body.object.sha) {
                throw new Error("Get ref response body missing 'object.sha' key");
            }
            var prev = body.object.sha;
            if (prev === next) {
                throw new Error("Expected ref hash to have changed, but it has not");
            }

            return github.patch('/repos/:owner/:repo/git/refs/:ref', {
                sha: next,
                force: true
            }, { ref: ref });
        }, function (error) {
            if (!error || error.statusCode !== 404) {
                throw error;
            }

            // If the reference does not already exist, create it.
            return github.post('/repos/:owner/:repo/git/refs', {
                ref: 'refs/' + ref,
                sha: next
            });
        }).then(function () {
            return next;
        });
    });
}

exports.updateEpoch = updateEpoch;
