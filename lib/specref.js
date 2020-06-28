"use strict";

const fetch = require('node-fetch');

async function get(ref) {
    if (Array.isArray(ref)) {
        ref = ref.join(",");
    }
    const url = "https://specref.herokuapp.com/bibrefs?refs=" + ref;
    const response = await fetch(url, {headers: { "User-Agent": "ganesh" }});
    // istanbul ignore if
    if (response.status != 200) {
        throw new Error(`Got status code ${response.status} from ${url} (expected 200)`);
    }
    return await response.json();
}

exports.get = get;
