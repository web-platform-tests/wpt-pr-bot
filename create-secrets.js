'use strict'

const {Datastore} = require('@google-cloud/datastore');
const fs = require('fs');

async function fetchSecret(tokenName) {
    const datastore = new Datastore({projectId: 'wpt-pr-bot'});
    const key = datastore.key(['Token', tokenName]);
    let entity = await datastore.get(key);
    return entity[0].Secret;
}

(async () => {
    const secrets = {
        webhookSecret: await fetchSecret('github-webhook-secret'),
        githubToken: await fetchSecret('wpt-pr-bot-github-token'),
    };
    await fs.promises.writeFile('secrets.json', JSON.stringify(secrets), 'utf8');
})();
