// istanbul ignore file

"use strict";

const bunyan = require('bunyan'),
      {LoggingBunyan} = require('@google-cloud/logging-bunyan');

const loggingBunyan = new LoggingBunyan();
const logger = bunyan.createLogger({
  name: 'wpt-pr-bot',
  streams: [
    // Log to the console at 'info' and above
    {stream: process.stdout, level: 'info'},
    // And log to Stackdriver Logging, logging at 'debug' and above
    loggingBunyan.stream('debug'),
  ],
});

module.exports = logger;
