'use strict'

const sandbox = require('sinon')
const tap = require('tap')
const test = tap.test
const _ = require('lodash')
const findAll = require('../../../lib/methods/findAll').findAll
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
      connector.tools = {
        getRootModelName: (Model) => { }
      }
      connector.sdkAPI = { query: (query, callback) => { } }
      Model = arrow.getModel('Posts')
      t.ok(arrow, 'Arrow has been started')
      t.end()
    })
    .catch((err) => {
      t.threw(err)
    })
})

test('## findAll unit test - Error Case without the query method ###', function (t) {
  // Data
  const error = { message: 'Test Error' }

  // Stubs and spies
  const cbErrorSpy = sandbox.spy()
  const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
    return {}
  })
  const objectFieldsStub = sandbox.stub(utils, 'getObjectFields').callsFake((Model) => {
    return 'IsDeleted,MasterRecordId,Name,Type,ParentId'
  })
  const queryStub = sandbox.stub(connector.sdkAPI, 'query').throws(error)

  // Execution
  findAll.call(connector, Model, cbErrorSpy)

  // Tests
  t.ok(cbErrorSpy.calledOnce)
  t.ok(cbErrorSpy.calledWith(error))
  t.ok(queryStub.calledOnce)
  t.ok(getRootModelNameStub.calledOnce)
  t.ok(getRootModelNameStub.calledWith(Model))
  t.ok(objectFieldsStub.calledOnce)
  t.ok(objectFieldsStub.calledWith(Model))

  t.end()
})

test('## findAll unit test - Error Case with the query method ###', function (t) {
  // Stubs and spies
  const cbErrorSpy = sandbox.spy()
  const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
    return { nameOnly: 'Account' }
  })
  const objectFieldsStub = sandbox.stub(utils, 'getObjectFields').callsFake((Model) => {
    return 'IsDeleted,MasterRecordId,Name'
  })
  const parseErrorStub = sandbox.stub(utils, 'parseError').callsFake(() => {
    return 'Parsed error'
  })
  const queryStub = sandbox.stub(connector.sdkAPI, 'query').callsFake((query, callback) => {
    callback('Some error')
  })

  // Execution
  findAll.call(connector, Model, cbErrorSpy)

  // Tests
  t.ok(cbErrorSpy.calledOnce)
  t.ok(cbErrorSpy.calledWith('Parsed error'))
  t.ok(getRootModelNameStub.calledOnce)
  t.ok(getRootModelNameStub.calledWith(Model))
  t.ok(objectFieldsStub.calledOnce)
  t.ok(objectFieldsStub.calledWith(Model))
  t.ok(parseErrorStub.calledOnce)
  t.ok(parseErrorStub.calledWith('Some error'))
  t.ok(queryStub.calledOnce)

  t.end()
})

test('## findAll unit test - OK Case ###', function (t) {
  // Data
  var result = {
    records: [
      {
        attributes: {},
        id: '1234'
      }
    ]
  }
  const instance = Model.instance(result, true)
  instance.setPrimaryKey(result.records.id)

  // Stubs and spies
  const cbOkSpy = sandbox.spy()
  const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
    return { nameOnly: 'Account' }
  })
  const objectFieldsStub = sandbox.stub(utils, 'getObjectFields').callsFake((Model) => {
    return 'IsDeleted,MasterRecordId,Name'
  })
  const lodashStub = sandbox.stub(_, 'omit').callsFake((result, prop) => {
    return { id: '1234' }
  })
  const queryStub = sandbox.stub(connector.sdkAPI, 'query').callsFake((query, callback) => {
    callback(null, result)
  })

  // Execution
  findAll.call(connector, Model, cbOkSpy)

  // Tests
  t.ok(cbOkSpy.calledOnce)
  t.equals(cbOkSpy.firstCall.args[0], null)
  t.deepequal(cbOkSpy.firstCall.args[1], [instance])
  t.ok(getRootModelNameStub.calledOnce)
  t.ok(getRootModelNameStub.calledWith(Model))
  t.ok(objectFieldsStub.calledOnce)
  t.ok(objectFieldsStub.calledWith(Model))
  t.ok(objectFieldsStub.calledOnce)
  t.ok(queryStub.calledOnce)
  t.equals(lodashStub.firstCall.args[1], 'attributes')

  t.end()
})

test('### Stop Arrow ###', (t) => {
  arrow.stop(function () {
    t.pass('Arrow has been stopped!')
    t.end()
  })
})
