Grown = require('..')

$ = module.exports = ->
  delete $[k] for k in $

  $.server = new Grown
    cwd: process.cwd()
    env: 'testing'

  $.server.fetch = Grown.plugs.testing($.server)

  $.close = ->
    Grown.burn()

  null

$.close = ->
  Grown.burn()