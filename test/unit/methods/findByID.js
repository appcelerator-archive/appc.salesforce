'use strict'

const sandbox = require('sinon')
const tap = require('tap')
const test = tap.test
const _ = require('lodash')
const findByID = require('../../../lib/methods/findByID').findByID
const server = require('../../server')
const utils = require('../../../lib/utils/index')

var arrow
var connector
var Model

tap.beforeEach((done) => {
  sandbox.createSandbox()
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
        sobject: { findByID: () => { } }
      }
      Model = arrow.getModel('Posts')
      t.ok(arrow, 'Arrow has been started')
      t.end()
    })
    .catch((err) => {
      t.threw(err)
    })
})

test('## findByID unit test - Error Case without error code ###', function (t) {
  // Stubs and spies
  const cbErrorSpy = sandbox.spy()
  const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
    return { nameOnly: 'Account' }
  })
  const sdkAPIStub = sandbox.stub(connector.sdkAPI.sobject, 'findByID').callsFake((modelName, id, callback) => {
    callback('Some error')
  })
  const parseErrorStub = sandbox.stub(utils, 'parseError').callsFake(() => {
    return 'Parsed error'
  })

  // Execution
  findByID.call(connector, Model, '1234', cbErrorSpy)

  // Tests
  t.ok(cbErrorSpy.calledOnce)
  t.ok(cbErrorSpy.calledWith('Parsed error'))
  t.ok(getRootModelNameStub.calledOnce)
  t.ok(getRootModelNameStub.calledWith(Model))
  t.ok(sdkAPIStub.calledOnce)
  t.ok(parseErrorStub.calledOnce)
  t.ok(parseErrorStub.calledWith('Some error'))

  t.end()
})

test('## findByID unit test - Error Case with error code ###', function (t) {
  // Stubs and spies
  const cbErrorSpy = sandbox.spy()
  const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
    return { nameOnly: 'Account' }
  })
  const sdkAPIStub = sandbox.stub(connector.sdkAPI.sobject, 'findByID').callsFake((modelName, id, callback) => {
    callback({ errorCode: 'NOT_FOUND' })
  })

  // Execution
  findByID.call(connector, Model, '1234', cbErrorSpy)

  // Tests
  t.ok(cbErrorSpy.calledOnce)
  t.ok(cbErrorSpy.calledWith())
  t.ok(getRootModelNameStub.calledOnce)
  t.ok(getRootModelNameStub.calledWith(Model))
  t.ok(sdkAPIStub.calledOnce)

  t.end()
})

test('## findByID unit test - Error Case nested catch ###', function (t) {
  // Stubs and spies
  const cbErrorSpy = sandbox.spy()
  const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
    return { nameOnly: 'Account' }
  })
  const sdkAPIStub = sandbox.stub(connector.sdkAPI.sobject, 'findByID').callsFake((modelName, id, callback) => {
    callback(null, {})
  })

  const lodashStub = sandbox.stub(_, 'omit').callsFake((result, prop) => {
    return ''
  })

  // Execution
  findByID.call(connector, Model, '1234', cbErrorSpy)

  // Tests
  t.ok(cbErrorSpy.calledOnce)
  t.ok(cbErrorSpy.calledWith())
  t.equals(cbErrorSpy.firstCall.args[0].message, 'The first argument to model.instance() cannot be a string: ')
  t.ok(lodashStub.calledOnce)
  t.equals(lodashStub.firstCall.args[1], 'attributes')
  t.ok(getRootModelNameStub.calledOnce)
  t.ok(getRootModelNameStub.calledWith(Model))
  t.ok(sdkAPIStub.calledOnce)

  t.end()
})

test('## findByID unit test - Error Case without the query method ###', function (t) {
  // Data
  const error = { message: 'Test Error' }

  // Stubs and spies
  const cbErrorSpy = sandbox.spy()
  const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
    return {}
  })
  const sdkAPIStub = sandbox.stub(connector.sdkAPI.sobject, 'findByID').throws(error)
  // Execution
  findByID.call(connector, Model, '1234', cbErrorSpy)

  // Tests
  t.ok(cbErrorSpy.calledOnce)
  t.ok(cbErrorSpy.calledWith(error))
  t.ok(getRootModelNameStub.calledOnce)
  t.ok(getRootModelNameStub.calledWith(Model))
  t.ok(sdkAPIStub.calledOnce)
  t.end()
})

test('## findByID unit test - OK Case ###', function (t) {
  // Data
  // Stubs and spies
  const cbOkSpy = sandbox.spy()
  const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
    return { nameOnly: 'Account' }
  })
  const sdkAPIStub = sandbox.stub(connector.sdkAPI.sobject, 'findByID').callsFake((modelName, id, callback) => {
    callback(null, {})
  })

  const lodashStub = sandbox.stub(_, 'omit').callsFake((result, prop) => {
    return { id: '1234' }
  })

  // Execution
  findByID.call(connector, Model, '1234', cbOkSpy)

  // Tests
  t.ok(cbOkSpy.calledOnce)
  t.ok(cbOkSpy.calledWith())
  t.ok(lodashStub.calledOnce)
  t.equals(lodashStub.firstCall.args[1], 'attributes')
  t.ok(getRootModelNameStub.calledOnce)
  t.ok(getRootModelNameStub.calledWith(Model))
  t.ok(sdkAPIStub.calledOnce)

  t.end()
})

test('### Stop Arrow ###', (t) => {
  arrow.stop(function () {
    t.pass('Arrow has been stopped!')
    t.end()
  })
})
