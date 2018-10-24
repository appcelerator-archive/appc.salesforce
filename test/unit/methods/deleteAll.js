'use strict'

const sandbox = require('sinon')
const tap = require('tap')
const test = tap.test
var async = require('async')
const deleteAll = require('../../../lib/methods/deleteAll').deleteAll
const server = require('../../server')
const Arrow = require('arrow')

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
    Model = arrow.getModel('Posts')
    t.ok(arrow, 'Arrow has been started')
    t.end()
  })
  .catch((err) => {
    t.threw(err)
  })
})

test('## deleteAll unit test - Error Case try/catch ###', function (t) {
// Data
  const error = { message: 'Test Error' }

// Stubs and spies
  const cbErrorSpy = sandbox.spy()
  const findAllStub = sandbox.stub(connector, 'findAll').throws(error)

// Execution
  deleteAll.call(connector, Model, cbErrorSpy)

// Tests
  t.ok(cbErrorSpy.calledOnce)
  t.ok(cbErrorSpy.calledWith(error))
  t.ok(findAllStub.calledOnce)

  t.end()
})

test('## deleteAll unit test - Error Case throw error after invoke findAll ###', function (t) {
  // Stubs and spies
  const cbErrorSpy = sandbox.spy()
  const findAllStub = sandbox.stub(connector, 'findAll').callsFake((Model, callback) => {
    callback('Error findAll')
  })

  // Execution
  deleteAll.call(connector, Model, cbErrorSpy)

  // Tests
  t.ok(cbErrorSpy.calledOnce)
  t.ok(cbErrorSpy.calledWith('Error findAll'))
  t.ok(findAllStub.calledOnce)
  t.equals(findAllStub.firstCall.args[0], Model)

  t.end()
})

test('## deleteAll unit test - Error Case ###', function (t) {
  // Data
  const instance1 = Model.instance({}, true)
  const instance2 = Model.instance({}, true)
  var arr = []
  arr.push(instance1)
  arr.push(instance2)
  const result = new Arrow.Collection(Model, arr)

  // Stubs and spies
  const cbErrorSpy = sandbox.spy()
  const findAllStub = sandbox.stub(connector, 'findAll').callsFake((Model, callback) => {
    callback(null, result)
  })
  const asyncStub = sandbox.stub(async, 'eachLimit').callsFake((arr, number, iterate, callback) => {
    callback('Some error')
  })

  // Execution
  deleteAll.call(connector, Model, cbErrorSpy)

  // Tests
  t.ok(cbErrorSpy.calledOnce)
  t.ok(cbErrorSpy.calledWith('Some error'))
  t.ok(findAllStub.calledOnce)
  t.equals(findAllStub.firstCall.args[0], Model)
  t.ok(asyncStub.calledOnce)

  t.end()
})

test('## deleteAll unit test - OK Case with result ###', function (t) {
  // Data
  const instance1 = Model.instance({}, true)
  const instance2 = Model.instance({}, true)
  var arr = []
  arr.push(instance1)
  arr.push(instance2)
  const result = new Arrow.Collection(Model, arr)

  // Stubs and spies
  const cbOkSpy = sandbox.spy()
  const findAllStub = sandbox.stub(connector, 'findAll').callsFake((Model, callback) => {
    callback(null, result)
  })
  const asyncEachLimitStub = sandbox.stub(async, 'eachLimit').callsArgOn(3, {})
  // Execution
  deleteAll.call(connector, Model, cbOkSpy)

  // Tests
  t.ok(cbOkSpy.calledOnce)
  t.ok(cbOkSpy.calledWith(null, arr.length))
  t.ok(findAllStub.calledOnce)
  t.equals(findAllStub.firstCall.args[0], Model)
  t.ok(asyncEachLimitStub.calledOnce)

  t.end()
})

test('## deleteAll unit test - OK Case without result ###', function (t) {
  // Data
  const result = new Arrow.Collection(Model, null)

  // Stubs and spies
  const cbOkSpy = sandbox.spy()
  const findAllStub = sandbox.stub(connector, 'findAll').callsFake((Model, callback) => {
    callback(null, result)
  })
  const asyncStub = sandbox.stub(async, 'eachLimit').callsFake((arr, number, iterate, callback) => {
    callback(null, {})
  })
  const toArrayStub = sandbox.stub(result, 'toArray').callsFake(() => {
    return null
  })

  // Execution
  deleteAll.call(connector, Model, cbOkSpy)

  // Tests
  t.ok(cbOkSpy.calledOnce)
  t.ok(cbOkSpy.calledWith())
  t.ok(findAllStub.calledOnce)
  t.equals(findAllStub.firstCall.args[0], Model)
  t.ok(asyncStub.calledOnce)
  t.ok(toArrayStub.calledOnce)

  t.end()
})

test('### Stop Arrow ###', (t) => {
  arrow.stop(function () {
    t.pass('Arrow has been stopped!')
    t.end()
  })
})
