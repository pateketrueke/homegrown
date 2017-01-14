{ resolve } = require('path')

$ = require('./_protocol')

Homegrown = require('../lib')

useConfig = (name) ->
  $.server.use Homegrown.plugs.router(resolve(__dirname, '_fixtures', name))

describe '#router', ->
  beforeEach $

  it 'should fail on undefined `cwd` option', ->
    expect(-> $.server.use Homegrown.plugs.router()).toThrow()

  it 'should responds to unsupported requests with 405', (done) ->
    useConfig 'no-routes'

    $.server.fetch().then (res) ->
      expect(res.statusMessage).toEqual 'Method Not Allowed'
      expect(res.statusCode).toEqual 405
      done()

  it 'should responds to unhandled routes with 501', (done) ->
    expect(-> useConfig 'one-route').toThrow()

    $.server.fetch().then (res) ->
      expect(res.statusCode).toEqual 501
      expect(res.statusMessage).toEqual 'Not Implemented'
      done()

  it 'should responds to undefined handlers with 500', (done) ->
    useConfig 'valid-routes'

    $.server.fetch('/no').then (res) ->
      expect(res.statusCode).toEqual 500
      expect(res.body).toMatch /Undefined .+? handler/
      done()

  it 'should responds to defined handlers with 200', (done) ->
    useConfig 'valid-routes'

    $.server.fetch('/yes').then (res) ->
      expect(res.body).toEqual 'OSOM'
      expect(res.statusMessage).toEqual 'OK'
      expect(res.statusCode).toEqual 200
      done()

  it 'should responds to unmatched routes with 404', (done) ->
    useConfig 'valid-routes'

    $.server.fetch('/not/found').then (res) ->
      expect(res.statusMessage).toEqual 'Not Found'
      expect(res.statusCode).toEqual 404
      done()

  it 'should append `conn.params` and `conn.handler` when a route matches', (done) ->
    $.server.mount (conn) ->
      conn.next ->
        $.params = conn.params
        $.handler = conn.handler

    useConfig 'valid-routes'

    $.server.fetch('/x').then ->
      expect($.params).toEqual { value: 'x' }
      expect($.handler.controller).toEqual 'Example'
      expect($.handler.action).toEqual 'test_params'
      done()

  it 'should fail when requiring any broken source', (done) ->
    useConfig 'valid-routes'

    $.server.fetch('/broken/handler').then (res) ->
      expect(res.body).toContain 'Unexpected token'
      expect(res.statusCode).toEqual 500
      done()

  it 'should fail on invalid route-middlewares', (done) ->
    useConfig 'with-middlewares'

    $.server.fetch('/no').then (res) ->
      expect(res.body).toMatch /Middleware .+? should be callable/
      expect(res.statusCode).toEqual 500
      done()

  it 'should fail on unknown route-middlewares', (done) ->
    useConfig 'with-middlewares'

    $.server.fetch('/err').then (res) ->
      expect(res.body).toMatch /Undefined .+? middleware/
      expect(res.statusCode).toEqual 500
      done()

  it 'should run route-middlewares properly', (done) ->
    useConfig 'with-middlewares'

    $.server.fetch('/yes').then (res) ->
      expect(res.body).toEqual 'OSOM!'
      done()

  it 'should fail on invalid pipeline-handlers', (done) ->
    useConfig 'with-middlewares'

    $.server.fetch('/maybe').then (res) ->
      expect(res.body).toMatch /Undefined .+? handler/
      expect(res.statusCode).toEqual 500
      done()

  it 'should run pipeline-handlers properly', (done) ->
    useConfig 'with-middlewares'

    $.server.fetch('/surely').then (res) ->
      expect(res.body).toEqual 'OSOM!'
      done()

  it 'should inject values and methods', (done) ->
    useConfig 'with-middlewares'

    $.server.fetch('/other-example').then (res) ->
      expect(res.body).toEqual '["SYNC","ASYNC"]'
      done()
