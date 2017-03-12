'use strict';

/* eslint-disable global-require */

const CLR = '\x1b[K';

module.exports = $ => {
  const IS_DEBUG = $.flags.debug === true;

  /* istanbul ignore else */
  if (IS_DEBUG) {
    require('debug').enable('grown,grown:*');
  }

  require('source-map-support').install();

  const _ = require('../lib/util');
  const _repl = require('../lib/repl');

  const path = require('path');
  const chalk = require('chalk');

  const cwd = process.cwd();

  const _test = require('../../lib/plugs/testing.js');

  const _farm = require(path.join(cwd, 'app'));

  let farm;

  // small bootstrap
  function _startApplication() {
    farm = _farm();

    farm.fetch = _test(farm);

    const _close = _repl(farm);

    farm.on('close', () => _close());

    _.echo(chalk.gray('↺ 2/2 Starting REPL...'), CLR, '\r');

    farm.listen('test://', (app) => {
      _.echo(chalk.gray('— Listening at '), chalk.yellow(app.location.href), '\n');
      _.echo(chalk.gray('— Type .help to show all available commands'), '\n');
    });
  }

  _.echo(chalk.gray('↺ 1/2 Initializing REPL...'), CLR, '\r');

  _startApplication();

  function _reload() {
    return _farm.teardown(() => {
      _.clearModules();
      _startApplication();
    });
  }

  process.on('repl:reload', () => _reload());
  process.on('exit', () => _farm.teardown());
};
