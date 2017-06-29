'use strict';

const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');

function fixRefs(schema) {
  if (typeof schema === 'object') {
    if (Array.isArray(schema)) {
      return schema.map(fixRefs);
    }

    if (schema.$ref && schema.$ref.indexOf('#/') === -1) {
      schema.$ref = `#/definitions/${schema.$ref}`;
    }

    Object.keys(schema).forEach(prop => {
      schema[prop] = fixRefs(schema[prop]);
    });
  }

  return schema;
}

module.exports = ($, argv, logger) => {
  const cwd = $.get('cwd', process.cwd());
  const src = path.join(cwd, 'db/migrations');

  if (argv.flags.snapshot) {
    const fulldate = [
      new Date().getFullYear(),
      `0${new Date().getMonth() + 1}`.substr(-2),
      new Date().getDate(),
    ].join('');

    const hourtime = [
      `0${new Date().getHours()}`.subtr(-2),
      `0${new Date().getMinutes()}`.substr(-2),
    ].join('');

    const name = typeof argv.flags.snapshot === 'string'
      ? `_${argv.flags.snapshot.replace(/\W+/g, '_').toLowerCase()}`
      : '';

    const file = path.join(src, `${fulldate}_${hourtime}${name}.json`);

    return logger('write', path.relative(cwd, file), () => {
      const schemas = {};

      (argv._.length ? argv._ : Object.keys($.extensions.models)).map(model => {
        if (!$.extensions.models[model]) {
          throw new Error(`Undefined model ${model}`);
        }

        return $.extensions.models[model];
      })
      .forEach(model => {
        schemas[model.name] = model.options.$schema;
      });

      fs.outputJsonSync(file, {
        description: typeof argv.flags.snapshot !== 'string'
          ? new Date().toISOString()
          : argv.flags.snapshot,
        definitions: fixRefs(schemas),
      }, { spaces: 2 });
    });
  }

  const all = glob.sync('**/*.json', { cwd: src });

  if (!all.length) {
    return logger.info('\r\r{% log No migrations found %}\n');
  }

  const models = fs.readJsonSync(path.join(src, all.pop()));
  // const types = require('json-schema-sequelizer/lib/types');

  // FIXME: model this logic inside json-schema-sequelizer; tl-dr
  // re-creation of schemas should be reusable, also the dereferenced
  // schema should not mutate model.options.$schema to keep all $refs as-is
  console.log(models.definitions);
  // return Promise.all(Object.keys(models.definitions).map(model => {
  //   return $.extensions.models[model].sequelize
  //     .define(model, types.convertSchema(models.definitions[model]).props).sync()
  //     .then(() => {
  //       logger.info('\r\r{% log %s was migrated %}\n', model);
  //     });
  // }));
};
