'use strict'

const sinon = require('sinon')
const tap = require('tap')
const test = tap.test
const query = require('../../../lib/methods/query').query
const server = require('../../server')
const utils = require('../../../lib/utils/index')
const _ = require('lodash')
const Arrow = require('arrow')

const sandbox = sinon.sandbox

var arrow
var connector
var Model

tap.beforeEach((done) => {
  sandbox.create()
  done()
})

tap.afterEach((done) => {
  sandbox.restore()
  done()
})

test('### Start Arrow ###', (t) => {
  server()
        .then((inst) => {
          arrow = inst
          connector = arrow.getConnector('appc.salesforce.1')
          connector.tools = { getRootModelName: (Model) => { } }
          connector.sdkAPI = {
            convertDateToJSFDateTime: (obj, type) => { },
            sobject: {
              limit: () => { },
              find: () => { },
              sort: () => { },
              skip: () => { },
              execute: () => { }
            }
          }
          Model = arrow.getModel('Posts')
          t.ok(arrow, 'Arrow has been started')
          t.end()
        })
        .catch((err) => {
          t.threw(err)
        })
})

test('## save unit test - Error Case try/catch ###', function (t) {
    // Data
  const err = { message: 'Error' }
  const options = {
    where: {
      Name: { $like: 'TEST 1' }
    }
  }

    // Stubs and spies
  const cbErrorSpy = sandbox.spy()
  const lodashIsFunctionStub = sandbox.stub(_, 'isFunction').callsFake((options) => { return false })
  const lodashHasStub = sandbox.stub(_, 'has').callsFake((fields, key) => { return false })
  const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
    return { nameOnly: 'Account' }
  })
  const findStub = sandbox.stub(connector.sdkAPI.sobject, 'find').throws(err)

    // Execution
  query.call(connector, Model, options, cbErrorSpy)

    // Tests
  t.ok(cbErrorSpy.calledOnce)
  t.ok(cbErrorSpy.calledWith(err))
  t.ok(findStub.calledOnce)
  t.ok(lodashIsFunctionStub.calledOnce)
  t.ok(lodashHasStub.calledOnce)
  t.ok(getRootModelNameStub.calledOnce)
  t.ok(getRootModelNameStub.calledWith(Model))

  t.end()
})

test('## save unit test - Error Case ###', function (t) {
    // Data
  const options = { unsel: 'Some data' }

    // Stubs and spies
  const cbErrorSpy = sandbox.spy()
  const lodashStub = sandbox.stub(_, 'isFunction').callsFake((options) => { return false })
  const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
    return { nameOnly: 'Account' }
  })

    // Execution
  query.call(connector, Model, options, cbErrorSpy)

    // Tests
  t.ok(cbErrorSpy.calledOnce)
  t.ok(cbErrorSpy.calledWith('"unsel" is not currently supported by the Salesforce connector.'))
  t.ok(lodashStub.calledOnce)
  t.ok(getRootModelNameStub.calledOnce)
  t.ok(getRootModelNameStub.calledWith(Model))

  t.end()
})

test('## save unit test - Error Case ###', function (t) {
    // Data
  const options = {
    order: 'Some data',
    skip: 'Some data'
  }

    // Stubs and spies
  const cbErrorSpy = sandbox.spy()
  const lodashStub = sandbox.stub(_, 'isFunction').callsFake((options) => { return false })
  const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
    return { nameOnly: 'Account' }
  })
  const findStub = sandbox.stub(connector.sdkAPI.sobject, 'find').callsFake((modelName, options, fields) => {
    return {}
  })
  const sortStub = sandbox.stub(connector.sdkAPI.sobject, 'sort').callsFake((sobjects, options) => {
    return {}
  })
  const limitStub = sandbox.stub(connector.sdkAPI.sobject, 'limit').callsFake((sobjects, options) => {
    return {}
  })
  const skipStub = sandbox.stub(connector.sdkAPI.sobject, 'skip').callsFake((sobjects, options) => {
    return {}
  })
  const parseErrorStub = sandbox.stub(utils, 'parseError').callsFake(() => {
    return 'Parsed error'
  })
  const executeStub = sandbox.stub(connector.sdkAPI.sobject, 'execute').callsFake((sobjects, callback) => {
    callback('Some error')
  })

    // Execution
  query.call(connector, Model, options, cbErrorSpy)

    // Tests
  t.ok(cbErrorSpy.calledOnce)
  t.ok(cbErrorSpy.calledWith('Parsed error'))
  t.ok(lodashStub.calledOnce)
  t.ok(getRootModelNameStub.calledOnce)
  t.ok(getRootModelNameStub.calledWith(Model))
  t.ok(findStub.calledOnce)
  t.ok(sortStub.calledOnce)
  t.ok(limitStub.calledOnce)
  t.ok(skipStub.calledOnce)
  t.ok(executeStub.calledOnce)
  t.ok(parseErrorStub.calledOnce)
  t.ok(parseErrorStub.calledWith('Some error'))

  t.end()
})

test('## save unit test - OK Case ###', function (t) {
    // Data
  const options = undefined

    // Stubs and spies
  const cbErrorSpy = sandbox.spy()
  const lodashStub = sandbox.stub(_, 'isFunction').callsFake((options) => { return false })
  const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
    return { nameOnly: 'Account' }
  })
  const findStub = sandbox.stub(connector.sdkAPI.sobject, 'find').callsFake((modelName, options, fields) => {
    return {}
  })
  const limitStub = sandbox.stub(connector.sdkAPI.sobject, 'limit').callsFake((sobjects, options) => {
    return {}
  })
  const executeStub = sandbox.stub(connector.sdkAPI.sobject, 'execute').callsFake((sobjects, callback) => {
    callback(null, [])
  })

    // Execution
  query.call(connector, Model, options, cbErrorSpy)

    // Tests
  t.ok(cbErrorSpy.calledOnce)
  t.ok(cbErrorSpy.calledWith(null, new Arrow.Collection(Model, [])))
  t.ok(lodashStub.calledOnce)
  t.ok(getRootModelNameStub.calledOnce)
  t.ok(getRootModelNameStub.calledWith(Model))
  t.ok(findStub.calledOnce)
  t.ok(limitStub.calledOnce)
  t.ok(executeStub.calledOnce)

  t.end()
})

test('## save unit test - OK Case ###', function (t) {
    // Data
  const options = undefined

    // Stubs and spies
  const cbErrorSpy = sandbox.spy()
  const lodashIsFunctionStub = sandbox.stub(_, 'isFunction').callsFake((options) => { return false })
  const lodashOmitStub = sandbox.stub(_, 'omit').callsFake((record, prop) => { return {} })
  const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
    return { nameOnly: 'Account' }
  })
  const findStub = sandbox.stub(connector.sdkAPI.sobject, 'find').callsFake((modelName, options, fields) => {
    return {}
  })
  const limitStub = sandbox.stub(connector.sdkAPI.sobject, 'limit').callsFake((sobjects, options) => {
    return {}
  })
  const executeStub = sandbox.stub(connector.sdkAPI.sobject, 'execute').callsFake((sobjects, callback) => {
    callback(null, [{}, {}])
  })

    // Execution
  query.call(connector, Model, options, cbErrorSpy)

    // Tests
  t.ok(cbErrorSpy.calledOnce)
  t.ok(cbErrorSpy.calledWith())
  t.ok(lodashIsFunctionStub.calledOnce)
  t.ok(lodashOmitStub.calledTwice)
  t.ok(getRootModelNameStub.calledOnce)
  t.ok(getRootModelNameStub.calledWith(Model))
  t.ok(findStub.calledOnce)
  t.ok(limitStub.calledOnce)
  t.ok(executeStub.calledOnce)

  t.end()
})

test('### Stop Arrow ###', (t) => {
  arrow.stop(function () {
    t.pass('Arrow has been stopped!')
    t.end()
  })
})
