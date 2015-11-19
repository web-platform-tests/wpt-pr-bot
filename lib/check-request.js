"use strict";
var crypto = require('crypto');
module.exports = function(body, header, secret) {
    var hash = crypto.createHmac('sha1', secret).update(body).digest('hex');
	console.log(header)
	console.log("sha1=" + hash)
    return ("sha1=" + hash) === header;
}