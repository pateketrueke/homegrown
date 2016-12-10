t = require('./_checktype')

describe '#model', ->
  describe 'JSON-Schema support', ->
    it 'should fake() simple objects', ->
      t.setup 'sqlite', ':memory:'

      FakeModel = t.define 'test',
        properties:
          str: type: 'string'
          num: type: 'number'
          int: type: 'integer'
          bol: type: 'boolean'
          ary:
            type: 'array'
            minItems: 1
            items:
              type: 'string'
          obj:
            type: 'object'
            properties:
              prop:
                type: 'string'
            required: ['prop']
        required: ['str', 'num', 'int', 'bol', 'ary', 'obj']

      sample = FakeModel.fake().findOne()

      expect(typeof sample.str).toEqual 'string'
      expect(typeof sample.num).toEqual 'number'
      expect(typeof sample.int).toEqual 'number'
      expect(typeof sample.bol).toEqual 'boolean'
      expect(typeof sample.ary).toEqual 'object'
      expect(typeof sample.ary[0]).toEqual 'string'
      expect(typeof sample.obj.prop).toEqual 'string'

    it 'should sync() simple objects (sqlite3)', (done) ->
      t.setup 'sqlite', ':memory:'

      FakeModel = t.define 'test',
        properties:
          str: type: 'string'
          num: type: 'number'
          int: type: 'integer'
          bol: type: 'boolean'
        required: ['str', 'num', 'int', 'bol']

      FakeModel.sync()
        .then(-> FakeModel.truncate())
        .then(-> FakeModel.create(str: 'OSOM'))
        .then((one) -> expect(one.get('str')).toEqual 'OSOM')
        .then(-> FakeModel.findAll())
        .then(([one]) ->
          expect(one.get('str')).toEqual 'OSOM'
          done())

    it 'should sync() nested objects (postgres)', (done) ->
      t.setup 'postgres'

      FakeModel = t.define 'test',
        properties:
          ary:
            type: 'array'
            minItems: 1
            items:
              type: 'string'
          obj:
            type: 'object'
            properties:
              prop:
                type: 'string'
            required: ['prop']
        required: ['ary', 'obj']

      FakeModel.sync()
        .then(-> FakeModel.truncate())
        .then(-> FakeModel.create({ ary: ['OSOM'], obj: { prop: 'OSOM' } }))
        .then((one) ->
          expect(one.get('ary')).toEqual ['OSOM']
          expect(one.get('obj')).toEqual { prop: 'OSOM' })
        .then(-> FakeModel.findAll())
        .then(([one]) ->
          expect(one.get('ary')).toEqual ['OSOM']
          expect(one.get('obj')).toEqual { prop: 'OSOM' }
          done())

  describe 'JSON-Schema -> Sequelize models', ->
    describe 'basic types (sqlite3)', ->
      beforeEach ->
        t.setup 'sqlite', ':memory:'

      it 'support null', t('null', null, null)
      it 'support string', t('string', 'OK', 'OK')
      it 'support number', t('number', '1.1', '1.1')
      it 'support integer', t('integer', 1, 1)
      it 'support boolean', t('boolean', true, true)

    describe 'object types (postgres)', ->
      beforeEach ->
        t.setup 'postgres'

      it 'support arrays',
        t 'array', [1, 2, 3], [1, 2, 3],
          items:
            type: 'integer'

      it 'support objects',
        t 'object', { foo: 'bar' }, { foo: 'bar' },
          properties:
            foo:
              type: 'string'

    describe 'virtual types (sequelize)', ->
      it 'support any values', t('virtual', 42, 42)
