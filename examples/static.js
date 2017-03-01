/* eslint-disable global-require */

const Grown = require('..');

Grown.new({
  mount: [
    require('serve-static')(__dirname),
    require('serve-index')(__dirname),
  ],
})
.listen(`${process.env.UWS > 0 ? 'uws' : 'http'}://0.0.0.0:5000`)
.then((app) => {
  console.log('Listening on', app.location.href);
})
.catch(error => console.log(error.stack));

