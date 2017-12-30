'use strict';

const path = require('path');
const fs = require('fs');

module.exports = (Grown, util) => {
  const Logger = require('log-pose');
  const _utils = require('log-pose/lib/utils.js');

  const REPL = require('repl');

  function _initializeContext(target) {
    util.readOnlyProperty(target, 'Grown', () => Grown);
  }

  function _startREPL() {
    const logDir = path.join(Grown.cwd, 'logs');

    /* istanbul ignore else */
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }

    const logFile = process.env.NODE_REPL_HISTORY
      || path.join(logDir, `REPL.${this.logName || 'default'}.log`);

    let fd;
    let ws;

    try {
      fd = fs.openSync(logFile, 'a');
      ws = fs.createWriteStream(logFile, { fd });

      ws.on('error', err => {
        throw err;
      });
    } catch (e) {
      // do nothing
    }

    const repl = REPL.start({
      replMode: REPL.REPL_MODE_STRICT,
      stdout: process.stdout,
      stdin: process.stdin,
      eval: this._runCMD,
      prompt: '',
    });

    repl.on('reset', this._initializeContext);
    this._initializeContext(repl.context);

    Logger
      .setLevel('info')
      .setLogger(repl.outputStream);

    repl.on('exit', () => {
      /* istanbul ignore else */
      if (fd) {
        fs.closeSync(fd);
      }
    });

    repl.pause();

    try {
      repl.rli.history = fs.readFileSync(logFile, 'utf-8').split('\n').reverse();
      repl.rli.history.shift();
      repl.rli.historyIndex = -1;
    } catch (e) {
      // do nothing
    }

    repl.rli.addListener('line', code => {
      if (code && code !== '.history') {
        /* istanbul ignore else */
        if (ws && repl.rli.history.indexOf(code, 1) === -1) {
          ws.write(`${code}\n`);
        }
      } else {
        repl.rli.historyIndex += 1;
        repl.rli.history.pop();
      }
    });

    repl.defineCommand('history', {
      help: 'Show the history',
      action() {
        Logger.getLogger().write(repl.rli.history.slice().reverse().join('\n'));
        repl.displayPrompt();
      },
    });

    return repl;
  }

  function _runCMD(cmd, context, filename, callback) {
    let value;

    try {
      value = util.invoke(cmd, context);
    } catch (e) {
      Logger.getLogger().info('\r{% error %s %}\r\n', e.toString());
      callback();
      return;
    }

    /* istanbul ignore else */
    if (typeof value === 'undefined') {
      callback();
      return;
    }

    /* istanbul ignore else */
    if (value && typeof value.then === 'function') {
      return value
        .then(result => {
          callback(null, result);
        })
        .catch(e => {
          Logger.getLogger().info('\r{% error %s %}\r\n', e.toString());
          callback();
        });
    }

    callback(null, value);
  }

  return Grown('REPL', {
    _initializeContext,
    _startREPL,
    _runCMD,

    start() {
      const tasks = util.flattenArgs(arguments);
      const repl = this._startREPL();
      const cbs = [];

      util.readOnlyProperty(this, 'repl', repl);

      repl.setPrompt(_utils.style('{% gray.pointer %}'));

      const use = Grown.argv._.slice();

      tasks.forEach(task => {
        Object.keys(task).forEach(key => {
          /* istanbul ignore else */
          if (use.indexOf(key) !== -1) {
            cbs.push(task[key]);
          }
        });
      });

      if (!cbs.length && use.length) {
        throw new Error(
          use.length === 1
            ? `Missing hook '${use[0]}'`
            : `Missing hooks ${use.join(', ')}`);
      }

      const logger = Logger.getLogger()
        .info('\r{% log Loading %s... %}', use.join(','));

      // FIXME: enable extensions?
      const ctx = {
        logger,
        repl,
      };

      Promise.resolve()
        .then(() => Promise.all(cbs.map(cb => cb && cb.call(null, ctx, util))))
        .then(() => {
          logger.info('{% log Type %} {% bold .help %} {% gray to list all available commands %}\n');

          repl.resume();
          repl.displayPrompt();
        })
        .catch(e => {
          /* istanbul ignore else */
          if (e.errors) {
            e.errors.forEach(err => {
              logger.info('{% exception %s (%s) %}\r\n', err.message, err.type);
            });
          }

          /* istanbul ignore else */
          if (e.original) {
            logger.info('{% failure %s %}\r\n', e.original.detail);
            logger.info('{% failure %s %}\r\n', e.original.message);
          }

          /* istanbul ignore else */
          if (!Grown.argv.flags.debug) {
            e = util.cleanError(e, Grown.cwd);
          }

          logger.info('\r{% error %s %}\r\n', e.stack || e.message);
          process.exit(1);
        });
    },
  });
};
