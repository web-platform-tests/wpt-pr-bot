"use strict";
var request = require('request'),
    q = require('q');

function qget(url, getHeaders, errFrom) {
    getHeaders = getHeaders || { "User-Agent": "ganesh" };
    var output = [];
    var deferred = q.defer();
    function onResponse(err, response, body) {
        if (err) {
            deferred.reject(err);
        } else if (response.statusCode == 200) {
            var link = response.headers.link;
	    body = JSON.parse(body);
            if (link) {
                output.push.apply(output, body);
                link = parseLink(link);
                if (link.next) {
                    request.get({
                        url: link.next,
                        headers: getHeaders
                    }, onResponse);
                    deferred.notify(body);
                } else {
                    deferred.notify(body);
                    deferred.resolve(output);
                }
            } else {
                deferred.resolve(body);
            }
        } else {
            deferred.reject(errFrom(body, url));
        }
    }
    request.get({
        url: url,
        headers: getHeaders
    }, onResponse);
    return deferred.promise;
}

exports.qget = qget;