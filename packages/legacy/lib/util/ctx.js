'use strict';

const STATUS_CODES = require('http').STATUS_CODES;

const objectNew = require('object-new');

const errorHandler = require('./error_');
const buildFactory = require('./factory_');
const pipelineFactory = require('./pipeline');

function buildPipeline(name, pipeline) {
  return (!Array.isArray(pipeline) ? [pipeline] : pipeline)
    .map((cb, key) => {
      const factory = buildFactory(cb, `${name}.${key}`);

      // push task to pipeline
      return {
        name: factory.name || name,
        call: factory.call,
        type: factory.type || 'function',
      };
    });
}

// standard http error-codes
function error(code, description) {
  const message = STATUS_CODES[code];
  const errObj = new Error(description || message);

  errObj.statusMessage = message;
  errObj.statusCode = code;

  return errObj;
}

function load(context, handler, name) {
  // read from memory first
  let Handler = handler.original;

  /* istanbul ignore else */
  if (!Handler && handler.filepath) {
    // lazily load and set the original module
    Handler
      = handler.original
      = require(handler.filepath);

    /* istanbul ignore else */
    if (Array.isArray(Handler)) {
      throw new Error(`Expecting a valid handler, given '${Handler}'`);
    }

    // object-new support
    if (typeof Handler.init === 'function' || Handler.methods) {
      Handler = objectNew(name, Handler, context);
    } else {
      context[name] = Handler;
    }

    // using classes?
    const isClass =
      typeof Handler === 'function'
      && Handler.constructor && Handler.name;

    // class-like constructors are always instantiated
    handler.instance = isClass ? new Handler() : Handler;
  }

  return Handler;
}

module.exports = {
  pipelineFactory,
  buildPipeline,
  buildFactory,
  errorHandler,
  error,
  load,
};