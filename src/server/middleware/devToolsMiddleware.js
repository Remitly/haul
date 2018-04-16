/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */
const fs = require('fs');
const path = require('path');
const opn = require('opn');
const select = require('platform-select');
const logger = require('../../logger');

/**
 * Launches given `url` in Chrome
 */
const launchBrowser = url => {
  const open = app => opn(url, { app });

  try {
    select(
      {
        darwin: open('google chrome'),
        /**
        * this will run Google Chrome or Google Chrome Canary on Windows
        */
        win32: open('chrome'),
        /**
         * on the rest of the platforms (linux) run. Let's run google-chrome if available
         */
        _: open('google-chrome'),
      },
      {
        /**
         * Google Chrome Canary is supported only at Mac and Windows
         * Windows is already covered in the previous step
         */
        darwin: open('google chrome canary'),
      },
      {
        /**
         * If user is on macOS and don't have both Chrome and Chrome Canary
         * let's spin off Safari
         */
        darwin: open('safari'),
      }
    );
  } catch (e) {
    logger.warn(
      `Cannot start browser for debugging. Navigate manually to "${url}"`
    );
  }
};

/**
 * Devtools middleware compatible with default React Native implementation
 */
function devToolsMiddleware(debuggerProxy) {
  return (req, res, next) => {
    switch (req.path) {
      /**
       * Request for the debugger frontend
       */
      case '/debugger-ui': {
        const readStream = fs.createReadStream(
          path.join(__dirname, '../assets/debugger.html')
        );
        res.writeHead(200, { 'Content-Type': 'text/html' });
        readStream.pipe(res);
        break;
      }

      /**
       * Request for the debugger worker
       */
      case '/debuggerWorker.js': {
        const readStream = fs.createReadStream(
          path.join(__dirname, '../assets/debuggerWorker.js')
        );
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        readStream.pipe(res);
        break;
      }

      /**
       * Request for (maybe) launching devtools
       */
      case '/launch-js-devtools': {
        if (!debuggerProxy.isDebuggerConnected()) {
          launchBrowser(`http://localhost:${req.socket.localPort}/debugger-ui`);
        }
        res.end('OK');
        break;
      }

      default:
        next();
    }
  };
}

module.exports = devToolsMiddleware;
