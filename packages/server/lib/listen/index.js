'use strict';

const debug = require('debug')('grown:listen');

const url = require('url');

const $server = require('./server');

module.exports = function $listen(location, params, cb) {
  /* istanbul ignore else */
  if (typeof location === 'function') {
    cb = location;
    location = undefined;
  }

  /* istanbul ignore else */
  if (typeof params === 'function') {
    const _params = cb;

    cb = params;
    params = _params || {};
  }

  const _server = {};

  params = params || {};

  const _protocolName = (typeof params === 'object'
    && (params.cert || params.key || params.ca)) ? 'https' : 'http';

  if (typeof location === 'object') {
    _server.location = location;
    _server.location.host = _server.location.host || '';
    _server.location.port = _server.location.port || '80';
    _server.location.protocol = _server.location.protocol || 'http:';
  } else if (!isNaN(location)) {
    _server.location = url.parse(`${_protocolName}://0.0.0.0:${location}`);
  } else if (typeof location === 'string') {
    _server.location = url.parse(location.indexOf('://') === -1 ? `http://${location}` : location);
  } else if (!location) {
    _server.location = url.parse(`${_protocolName}://0.0.0.0:80/`);
  }

  _server.port = +(_server.location.protocol === 'https:' && (params.cert && params.key)
    ? (_server.location.port || 443)
    : (_server.location.port || 80));

  _server.location.host = _server.location.host.split(':')[1]
    ? _server.location.host
    : `${_server.location.host}:${_server.port}`;

  _server.host = _server.location.host.split(':')[0];

  let _close;

  _server.close = () => {
    /* istanbul ignore else */
    if (_close) {
      this._events.emit('end', _server);
      _close();
    }
  };

  debug('#%s Initializing listener for %s', process.pid, _server.host);

  return new Promise((resolve, reject) => {
    const _listen = () => this._events.emit('listen', _server);
    const _done = () => this._events.emit('done');

    function done(err) {
      /* istanbul ignore else */
      if (err) {
        return reject(err);
      }

      /* istanbul ignore else */
      if (typeof this !== 'undefined') {
        _close = this.close ? this.close.bind(this, _server.location) : null;
      }

      Promise.resolve()
        .then(() => _listen())
        .then(() => debug('#%s Done. Starting application', process.pid))
        .then(() => resolve(_server) || _done())
        .then(() => cb && cb(_server))
        .catch(reject);
    }

    try {
      if (!this._servers[_server.port]) {
        this._servers[_server.port] = $server.call(this, _server, params, done);
      } else {
        debug('#%s Server at port %s already initialized', process.pid, _server.port);
        done();
      }
    } catch (e) {
      debug('#%s Server was errored: %s', process.pid, e.message);
      done(e);
      return;
    }

    debug('#%s Server registered at %s', process.pid, _server.host);

    this._hosts[_server.location.host] = _server;
  });
};
