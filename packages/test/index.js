'use strict';

module.exports = (Grown, util) => {
  const Request = require('./request')(Grown, util);
  const Mock = require('./mock')(Grown, util);

  return Grown('Test', {
    include: [
      Request,
      Mock,
    ],
  });
};
