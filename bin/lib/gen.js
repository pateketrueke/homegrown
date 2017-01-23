'use strict';

/* eslint-disable global-require */

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

const IS_DEBUG = process.argv.indexOf('--debug') > -1;

/* istanbul ignore else */
if (IS_DEBUG) {
  require('debug').enable('haki,haki:*');
}

const cwd = process.cwd();

const _ = require('./_util');

const Haki = require('haki');
const path = require('path');
const chalk = require('chalk');

const thisPkg = require('../../package.json');

const _name = chalk.green(`${thisPkg.name} v${thisPkg.version}`);
const _node = chalk.gray(`node ${process.version}`);

_.echo(`${_name} ${_node}\n`);

const haki = new Haki(cwd);

haki.load(require.resolve('./_tasks'));

function _getOptions() {
  // translate quoted values
  const reQuotes = /^(.+?)=(.+?)$/g;

  return _.requestParams(process.argv.slice(4)
    .map((x) => {
      return x.indexOf(' ') === -1 ? x : x.replace(reQuotes, '$1="$2"');
    }).join('\n'));
}

function _showDetails(err, result) {
  if (err) {
    console.log(err.toString(), '?');
    _.echo(chalk.red(err), '?\n');
    _.die(1);
    return;
  }

  result.changes.forEach((f) => {
    _.echo(chalk.green(f.type), ' ', chalk.yellow(path.relative(cwd, f.destFile)), '\n');
  });

  result.failures.forEach((f) => {
    _.echo(chalk.red(f.type), ' ', chalk.yellow(path.relative(cwd, f.destFile)), '\n');
    _.echo(chalk.red(`— ${f.error}`), '\n');
  });

  if (!(result.error || result.failures.length)) {
    _.echo(chalk.green('✔ Done.\n'));
  } else {
    _.echo(chalk.red(`${result.error
      ? result.error.message
      : 'Try again with --force to apply the changes'}\n`));
    _.die(1);
  }
}

function _executeTask(cmd) {
  const _env = {
    env: process.env.NODE_ENV,
    isDev: process.env.NODE_ENV === 'dev',
    isTest: process.env.NODE_ENV === 'test',
    isProd: process.env.NODE_ENV === 'prod',
    isStage: process.env.NODE_ENV === 'stage',
  };

  const _opts = _getOptions();
  const _locals = _.merge({}, _env, _opts.body);

  haki.runGenerator(cmd, _locals, _opts.force)
    .then(result => _showDetails(undefined, result))
    .catch(_showDetails);
}

function _showTasks() {
  haki.chooseGeneratorList(_showDetails);
}

const args = process.argv.slice(3);

if (args.length) {
  _executeTask(args.shift());
} else {
  _showTasks();
}
