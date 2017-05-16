'use strict'

const sinon = require('sinon')
const tap = require('tap')
const test = tap.test
const create = require('../../../lib/methods/create').create
const server = require('../../server')
const utils = require('../../../lib/utils/index')

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
            sobject: { create: () => { } }
          }
          Model = arrow.getModel('Posts')
          t.ok(arrow, 'Arrow has been started')
          t.end()
        })
        .catch((err) => {
          t.threw(err)
        })
})

test('## create unit test - Error Case try/catch ###', function (t) {
    // Data
  const values = {}
  const err = { message: 'Error' }

    // Stubs and spies
  const cbOkSpy = sandbox.spy()
  const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
    return { nameOnly: 'Account' }
  })
  const createStub = sandbox.stub(connector.sdkAPI.sobject, 'create').throws(err)

    // Execution
  create.call(connector, Model, values, cbOkSpy)

    // Tests
  t.ok(cbOkSpy.calledOnce)
  t.ok(cbOkSpy.calledWith(err))
  t.ok(createStub.calledOnce)
  t.equals(createStub.firstCall.args[0], 'Account')
  t.ok(getRootModelNameStub.calledOnce)
  t.ok(getRootModelNameStub.calledWith(Model))

  t.end()
})

test('## create unit test - Error Case ###', function (t) {
    // Data
  const values = {}

    // Stubs and spies
  const cbOkSpy = sandbox.spy()
  const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
    return { nameOnly: 'Account' }
  })
  const createStub = sandbox.stub(connector.sdkAPI.sobject, 'create').callsFake((modelName, payload, callback) => {
    callback('Some error')
  })
  const parseErrorStub = sandbox.stub(utils, 'parseError').callsFake(() => {
    return 'Parsed error'
  })

    // Execution
  create.call(connector, Model, values, cbOkSpy)

    // Tests
  t.ok(cbOkSpy.calledOnce)
  t.ok(cbOkSpy.calledWith('Parsed error'))
  t.ok(createStub.calledOnce)
  t.equals(createStub.firstCall.args[0], 'Account')
  t.ok(getRootModelNameStub.calledOnce)
  t.ok(getRootModelNameStub.calledWith(Model))
  t.ok(parseErrorStub.calledOnce)
  t.ok(parseErrorStub.calledWith('Some error'))

  t.end()
})

test('## create unit test - OK Case ###', function (t) {
    // Data
  const values = {}

    // Stubs and spies
  const cbOkSpy = sandbox.spy()
  const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
    return { nameOnly: 'Account' }
  })
  const findOneStub = sandbox.stub(connector, 'findOne').callsFake((Model, id, callback) => {
    callback(null, {})
  })
  const createStub = sandbox.stub(connector.sdkAPI.sobject, 'create').callsFake((modelName, payload, callback) => {
    const result = { id: '1234' }
    callback(null, result)
  })

    // Execution
  create.call(connector, Model, values, cbOkSpy)

    // Tests
  t.ok(cbOkSpy.calledOnce)
  t.ok(cbOkSpy.calledWith(null, {}))
  t.ok(createStub.calledOnce)
  t.ok(findOneStub.calledOnce)
  t.equals(findOneStub.firstCall.args[0], Model)
  t.equals(createStub.firstCall.args[0], 'Account')
  t.ok(getRootModelNameStub.calledOnce)
  t.ok(getRootModelNameStub.calledWith(Model))

  t.end()
})

test('### Stop Arrow ###', (t) => {
  arrow.stop(function () {
    t.pass('Arrow has been stopped!')
    t.end()
  })
})
