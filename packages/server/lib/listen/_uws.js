'use strict';

const debug = require('debug')('grown:uws');

const STATUS_CODES = require('http').STATUS_CODES;

const { Transform, Readable } = require('stream');

const uWS = require('uWebsockets.js');
const qs = require('querystring');

const _util = require('util');

const $host = require('./host');

function readBody(req, res, cb) {
  const stream = new Readable();

  stream._read = () => true;
  stream._abort = () => {
    stream.destroy();
    cb();
  };

  req.pipe = stream.pipe.bind(stream);
  req.stream = stream;

  let buffer;
  res.onData((part, end) => {
    const chunk = Buffer.from(part);
    const slice = part.slice(part.byteOffset, part.byteLength);

    stream.push(new Uint8Array(slice));

    if (end) {
      stream.push(null);

      if (buffer) {
        cb(Buffer.concat([buffer, chunk]).toString('utf8'));
      } else {
        cb(chunk.toString('utf8'));
      }
    } else if (buffer) {
      buffer = Buffer.concat([buffer, chunk]);
    } else {
      buffer = Buffer.concat([chunk]);
    }
  });
}

function ServerRequest(req) {
  Transform.call(this);

  this._writableState.objectMode = true;
  this._readableState.objectMode = false;

  this.body = {};
  this.url = req.url || '/';
  this.method = req.method || 'GET';
  this.headers = _util._extend({}, req.headers);
  this.rawHeaders = [];

  Object.keys(req.headers).forEach(key => {
    this.rawHeaders.push(key);
    this.rawHeaders.push(req.headers[key]);
  });
}

_util.inherits(ServerRequest, Transform);

function ServerResponse(resp) {
  Transform.call(this);

  this._buffer = [];
  this._headers = {};
  this._pending = false;
  this._response = resp;

  this.aborted = false;
  this.finished = false;
  this.statusCode = 501;
  this.statusMessage = STATUS_CODES[this.statusCode];

  resp.onAborted(() => {
    if (this.stream) {
      this.stream._abort();
    }

    this.aborted = true;
    this.finished = true;
  });

  this.on('finish', () => {
    const body = Buffer.concat(this._buffer);

    this._headers['content-length'] = body.length.toString();

    const head = {};

    Object.keys(this._headers).forEach(key => {
      head[key.replace(/\b([a-z])/g, $0 => $0.toUpperCase())] = this._headers[key];
    });

    resp.writeStatus(`${this.statusCode} ${STATUS_CODES[this.statusCode]}`);
    this.writeHead(this.statusCode, head);
    this.finished = true;

    resp.write(body);
    resp.end();
  });
}

_util.inherits(ServerResponse, Transform);

ServerResponse.prototype._transform = function _transform(chunk, encoding, next) {
  this._buffer.push(chunk);
  next();
};

ServerResponse.prototype.writeHead = function writeHead(statusCode, reason, headers) {
  /* istanbul ignore else */
  if (this.finished) {
    throw new Error('Response is already sent');
  }

  /* istanbul ignore else */
  if (reason && typeof reason === 'object') {
    headers = reason;
    reason = undefined;
  }

  this.statusCode = statusCode;
  this.statusMessage = reason || STATUS_CODES[statusCode] || 'unknown';

  /* istanbul ignore else */
  if (headers) {
    Object.keys(headers).forEach(key => {
      this.setHeader(key, headers[key]);
    });
  }
};

ServerResponse.prototype.setHeader = function setHeader(name, value) {
  this._headers[name.toLowerCase()] = value;
};

ServerResponse.prototype.getHeader = function getHeader(name) {
  return this._headers[name.toLowerCase()];
};

ServerResponse.prototype.removeHeader = function removeHeader(name) {
  delete this._headers[name.toLowerCase()];
};

ServerResponse.prototype.end = function end(code = 200) {
  /* istanbul ignore else */
  if (code > 0) {
    this.statusCode = code;
  }

  Transform.prototype.end.call(this);
};

module.exports = function _uws(ctx, options, callback, protocolName) {
  let app;
  if (protocolName === 'https') {
    app = uWS.SSLApp(options.https);
  } else {
    app = uWS.App();
  }

  this.close = () => uWS.us_listen_socket_close(app._self);

  app.listen(ctx.host, ctx.port, socket => {
    debug('#%s Server was started and listening at port', process.pid, ctx.port);

    app._self = socket;
    app.any('/*', (res, req) => {
      req.headers = { host: ctx.host };
      req.forEach((k, v) => {
        req.headers[k] = v;
      });

      const _req = new ServerRequest(req);
      const _resp = new ServerResponse(res);

      const next = (data, cb) => {
        if (typeof data === 'string') {
          _req.body = cb(data);
          _req._body = true;
        }

        $host.call(this, ctx.location, _req, _resp);
      };

      const type = req.getHeader('content-type');

      if (type.includes('/json')) {
        readBody(req, res, data => next(data, JSON.parse));
      } else if (type.includes('/x-www-form-urlencoded')) {
        readBody(req, res, data => next(data, qs.parse));
      } else {
        next();
      }
    });

    callback.call(this);
  });
};
