// istanbul ignore file

'use strict';

const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();
const SECRET_PREFIX = 'projects/wpt-pr-bot/secrets/';
const SECRET_SUFFIX = '/versions/latest';

/**
 * fetchSecret retrieves the latest version of the secret from secret manager.
 * @param {string} tokenName The name of the secret in Secret Manager
 * @return {string} The sensitive value stored in Secret Manager.
 */
async function fetchSecret(tokenName) {
    const [version] = await client.accessSecretVersion({
        name: SECRET_PREFIX + tokenName + SECRET_SUFFIX,
    });
    return version.payload.data.toString();
}

/**
 * loadSecrets retrieves all the secrets needed for the program
 * @return {object} The object with all of the secrets
 */
async function loadSecrets() {
    const secrets = {
        webhookSecret: await fetchSecret('github-webhook-secret'),
        githubToken: await fetchSecret('wpt-pr-bot-github-token'),
        bugsWebkit: await fetchSecret('wpt-pr-bot-bugswebkit-token'),
    };
    return secrets;
}

exports.loadSecrets = loadSecrets;
