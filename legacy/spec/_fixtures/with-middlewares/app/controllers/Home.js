module.exports = {
  pipeline: {
    err: 'undef',
    test: '_suffix',
    index: '_suffix',
  },
  _suffix($) {
    return $.next(() => {
      $.resp_body = `${$.resp_body}!`;
    });
  },
  index($) {
    $.resp_body = 'OSOM';
  },
  test($) {
    return this.index($);
  },
  err() {
  },
};