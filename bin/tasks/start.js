'use strict';

/* eslint-disable global-require */

module.exports = ($, cwd) => {
  const IS_DEBUG = $.flags.debug === true;
  const IS_REPL = $.flags.repl;
  const IS_DEV = process.env.NODE_ENV === 'development';

  const PORT = $.flags.port || process.env.PORT || 8080;
  const HOST = $.flags.host || process.env.HOST || '0.0.0.0';

  /* istanbul ignore else */
  if (IS_DEV) {
    require('source-map-support').install();
  }

  // common helpers
  const _ = require('../lib/util');
  const _repl = require('../lib/repl');

  const path = require('path');
  const chalk = require('chalk');
  const cleanStack = require('clean-stack');

  const _protocol = $.flags.uws === true ? 'uws' : `http${$.flags.https === true ? 's' : ''}`;

  const _test = require('../../lib/plugs/testing.js');

  const _farm = require(path.join(cwd, 'app/server'));

  // initialization
  let farm;

  function _startApplication(done) {
    try {
      _.echo(chalk.gray('↺ Initializing framework ...'), '\r\r');

      const _host = `${_protocol}://${HOST}:${PORT}`;

      farm = _farm();

      /* istanbul ignore else */
      if (IS_REPL) {
        farm.fetch = _test(farm);

        const _close = _repl($, farm);

        farm.on('close', () => _close());
      }

      _.echo(chalk.gray('↺ Starting server ...'), '\r\r');

      // start server
      farm.run(() =>
        farm.listen(_host, app => {
          _.echo(chalk.green('✔ Server is ready'), ' ', chalk.gray(`(local v${_farm.version})`), '\r\n');
          _.echo(chalk.gray('› Listening at '), chalk.yellow(app.location.href), '\n');

          /* istanbul ignore else */
          if (IS_REPL) {
            _.echo(chalk.gray('› Type .help to list all available commands'), '\n');
          }

          /* istanbul ignore else */
          if (typeof done === 'function') {
            done(farm, app);
          }
        }).catch(e => {
          _.echo(chalk.red((IS_DEBUG && cleanStack(e.stack)) || e.message), '\r\n');
          _.die(1);
        }));

      /* istanbul ignore else */
      if (IS_REPL) {
        farm.on('reload', () => _farm.teardown(_startApplication));
      }
    } catch (e) {
      _.echo(chalk.red((IS_DEBUG && cleanStack(e.stack)) || e.message), '\r\n');
      _.die(1);
    }
  }

  _startApplication();

  process.on('SIGINT', () => _farm.teardown(() => process.exit()));
};
