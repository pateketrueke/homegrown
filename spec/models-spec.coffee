{ resolve } = require('path')

Grown = require('..')
util = require('../lib/util')
models = require('../lib/plugs/models')

$ = models({
  settings: resolve(__dirname, '_fixtures/app/config/database.js')
  folders: resolve(__dirname, '_fixtures/app/models')
})

describe '#models', ->
  beforeEach (done) ->
    @ctx = new Grown()
    $(@ctx, util)

    @ctx.emit('start').then done

  it 'should load all models hierarchically', ->
    expect(@ctx.extensions.models.Single).not.toBeUndefined()
    expect(@ctx.extensions.models.Parent).not.toBeUndefined()
    expect(@ctx.extensions.models.ParentChild).not.toBeUndefined()

  it 'should sync all models without issues', (done) ->
    { sync, Single } = @ctx.extensions.models

    sync().then =>
      Single.create(value: 'OSOM')
        .then (result) ->
          expect(result.get('id')).toEqual 1
          expect(result.get('value')).toEqual 'OSOM'
          done()
