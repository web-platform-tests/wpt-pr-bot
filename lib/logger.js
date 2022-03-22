// istanbul ignore file

"use strict";

const bunyan = require('bunyan'),
      {LoggingBunyan} = require('@google-cloud/logging-bunyan');

const streams = [];

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // And log to Stackdriver Logging, logging at 'debug' and above
  const loggingBunyan = new LoggingBunyan();
  streams.push(loggingBunyan.stream('debug'));
} else {
  // Log to the console at 'info' and above
  streams.push({stream: process.stdout, level: 'info'});
}

const logger = bunyan.createLogger({name: 'wpt-pr-bot', streams});

module.exports = logger;
