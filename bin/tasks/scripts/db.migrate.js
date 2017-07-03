'use strict';

const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');

const JSONSchemaSequelizer = require('json-schema-sequelizer');

module.exports = ($, argv, logger) => {
  const cwd = $.get('cwd', process.cwd());
  const dbs = Object.keys($.extensions.dbs);

  const baseDir = path.join(cwd, 'db/migrations');

  if (!argv.flags.save) {
    if (!argv.flags.db || dbs.indexOf(argv.flags.db) === -1) {
      throw new Error(`Missing connection to --db, given '${argv.flags.db}'`);
    }

    const configFile = path.join(baseDir, 'index.json');

    fs.ensureDirSync(baseDir);

    let method = 'status';

    const params = {};

    ['up', 'down', 'prev', 'next'].forEach(key => {
      if (argv.flags[key]) {
        method = key;

        if (typeof argv.flags[key] === 'string') {
          params.migrations = params.migrations || [];
          params.migrations.push(argv.flags[key]);
        }
      }
    });

    ['from', 'to'].forEach(key => {
      if (typeof argv.flags[key] === 'string') {
        params[key] = argv.flags[key];
      }
    });

    if (argv.raw.length) {
      params.migrations = argv.raw;
    }

    return JSONSchemaSequelizer.migrate($.extensions.dbs[argv.flags.db].sequelize, {
      configFile,
      baseDir,
      logging(message) {
        logger.info('\r\r{% gray %s %}\n', message);
      },
    })[method](params).then(result => {
      if (!Array.isArray(result)) {
        if (result.executed && result.executed.length) {
          logger.info('\r\r{% log Executed migrations: %}\n');

          result.executed.forEach(x => {
            logger.info('{% cyan.line %s %}\n', x);
          });
        }

        if (result.executed && result.executed.length === 0) {
          logger.info('\r\r{% log No executed migrations %}\n');
        }

        if (result.pending && result.pending.length) {
          logger.info('\r\r{% log Pending migrations: %}\n');

          result.pending.forEach(x => {
            logger.info('{% yellow.line %s %}\n', x);
          });
        }

        if (result.pending && result.pending.length === 0) {
          logger.info('\r\r{% log No pending migrations %}\n');
        }
      } else if (!result.length) {
        logger.info('\r\r{% log No changes were made %}\n');
      } else {
        logger.info('\r\r{% log %s migration%s %s %s %}\n',
          result.length,
          result.length === 1 ? '' : 's',
          result.length === 1 ? 'was' : 'were',
          argv.flags.up || argv.flags.next ? 'applied' : 'reverted');
      }
    });
  }

  if (!argv.flags.db || dbs.indexOf(argv.flags.db) === -1) {
    throw new Error(`Missing connection to --db, given '${argv.flags.db}'`);
  }

  const models = $.extensions.dbs[argv.flags.db].models;
  const defns = $.extensions.dbs[argv.flags.db].refs;

  const fulldate = [
    new Date().getFullYear(),
    `0${new Date().getMonth() + 1}`.substr(-2),
    `0${new Date().getDate() + 1}`.substr(-2),
  ].join('');

  const fixedDeps = (argv._.length ? argv._ : Object.keys(models)).map(model => {
    if (!models[model]) {
      throw new Error(`Undefined model ${model}`);
    }

    return defns[model].$schema;
  });

  const schemaDir = path.join(cwd, 'db/schema');

  const all = glob.sync('**/*.json', { cwd: schemaDir });
  const type = all.length ? 'update' : 'create';
  const dump = all.length && fs.readJsonSync(path.join(schemaDir, all.pop()));

  return Promise.all(fixedDeps.map(schema => {
    const hourtime = [
      `0${new Date().getHours()}`.substr(-2),
      `0${new Date().getMinutes()}`.substr(-2),
      '.',
      `0${new Date().getSeconds()}`.substr(-2),
      `000${new Date().getMilliseconds()}`.substr(-3),
    ].join('');

    const ref = schema.id;

    const name = typeof argv.flags.save === 'string'
      ? `_${argv.flags.save.replace(/\W+/g, '_').toLowerCase()}`
      : `_${type}_${models[ref].tableName.toLowerCase()}`;

    const file = path.join(baseDir, `${fulldate}${hourtime}${name}.js`);
    const src = path.relative(cwd, file);

    return logger('write', src, end =>
      JSONSchemaSequelizer.generate(ref, dump, models)
        .then(code => {
          if (!code) {
            end(src, 'skip', 'end');
            return;
          }

          fs.outputFileSync(file, code);
          end();
        }));
  }));
};
