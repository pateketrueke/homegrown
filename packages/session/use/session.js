const passport = require('passport');
const bearer = require('passport-http-bearer');

function authenticate(req) {
  return new Promise((resolve, reject) => {
    passport.authenticate('bearer', { session: false }, (err, session) => {
      if (err) {
        reject(err);
        return;
      }

      if (!session) {
        reject(new Error('Session not found?'));
        return;
      }

      Object.assign(req, session);

      resolve();
    })(req);
  });
}

module.exports = (ctx, cb) => {
  passport.use(new bearer.Strategy((token, done) => {
    if (typeof cb === 'function') {
      cb(token, done);
    } else {
      done(null, false);
    }
  }));

  return function $session(req) {
    const authorization = req.headers.authorization || '';
    const token = authorization.split(' ').pop() || '';

    if (!token) {
      throw new Error('Token not given?');
    }

    req.token = token;

    return authenticate(req);
  };
};