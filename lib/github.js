var token = process.env.GITHUB_TOKEN;
var repo = "web-platform-tests";
var owner = "w3c";
var request = require('request');

function post(url, body, options, callback) {
    if (!callback) {
        callback = options;
        options = {};
    }
    
    options = mergeOptions(options);
    request.post({
        url: replaceURL(url, options),
        headers: {
            "Authorization": "token " + token,
            "User-Agent": "ganesh"
        },
        body: typeof body == "string" ? body : JSON.stringify(body)
    }, function(error, response, body) {
        if (error) {
            callback(error)
        } else if (response.statusCode == 200) {
            callback(null, JSON.parse(body));
        } else {
            callback(JSON.parse(body));
        }
    });
}

function get(url, options, callback) {
    if (!callback) {
        callback = options;
        options = {};
    }
    options = mergeOptions(options);
    var headers = {
        "Authorization": "token " + token,
        "User-Agent": "foo"
    };
    var output = [];
    function onResponse(error, response, body) {
        if (error) {
            callback(error, response)
        } else if (response.statusCode == 200) {
            var link = response.headers.link;
            body = JSON.parse(body);
            if (link) {
                output.push.apply(output, body);
                link = parseLink(link);
                if (link.next) {
                    request.get({
                        url: link.next,
                        headers: headers
                    }, onResponse);
                } else {
                    callback(null, output)
                }
            } else {
                callback(null, body);
            }
        } else {
            callback(JSON.parse(body));
        }
    }
    request.get({
        url: replaceURL(url, options),
        headers: headers
    }, onResponse);
}

function parseLink(str) {
    var output = {};
    (str || '').split(',').forEach(function(pair) {
        pair = pair.match(/<([^>]+)>; rel="([^"]+)"/);
        output[pair[2]] = pair[1];
    });
    return output;
}

function mergeOptions(options) {
    var output = {
        repo: repo,
        owner: owner
    };
    options = options || {};
    for (var k in options) {
        output[k] = options[k];
    }
    return output;
}

function replaceURL(url, options) {
    var base = 'https://api.github.com';
    url = url || '';
    url = base + url.replace(base, '');
    return url.replace(/:([a-z-_]+)/gi, function(m, m1) {
        return options[m1];
    });
}

exports.get = get;
exports.post = post;