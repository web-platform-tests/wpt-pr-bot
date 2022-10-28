// istanbul ignore file

'use strict'

const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const fs = require('fs');
const client = new SecretManagerServiceClient();
const secretPrefix = 'projects/wpt-pr-bot/secrets/';
const secretSuffix = '/versions/latest';
// fetchSecret retrieves the latest version of the secret from secret manager.
async function fetchSecret(tokenName) {
    const [version] = await client.accessSecretVersion({
        name: secretPrefix + tokenName + secretSuffix,
    });
    return version.payload.data.toString();
}

// loadSecrets retrieves all the secrets needed for the program
async function loadSecrets() {
    const secrets = {
        webhookSecret: await fetchSecret('github-webhook-secret'),
        githubToken: await fetchSecret('wpt-pr-bot-github-token'),
        bugsWebkit: await fetchSecret('wpt-pr-bot-bugswebkit-token'),
    };
    return secrets;
}

exports.loadSecrets = loadSecrets;
