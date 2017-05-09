'use strict'

const sinon = require('sinon')
const tap = require('tap')
const test = tap.test
const mockery = require('mockery')
const server = require('../../server')

const sandbox = sinon.sandbox

var arrow
var connector
var Model

mockery.enable({
  warnOnReplace: false,
  warnOnUnregistered: false
})

var sdkFacadeStub = sandbox.stub()

mockery.registerMock('../utils/sdkFacade', sdkFacadeStub)
mockery.registerMock('appc-connector-utils', sandbox.spy())

var connect = require('../../../lib/lifecycle/connect').connect

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
      Model = arrow.getModel('Posts')
      t.ok(arrow, 'Arrow has been started')
      t.end()
    })
    .catch((err) => {
      t.threw(err)
    })
})

test('### connect Call - Error Case ###', (t) => {
  // Data
  const err = 'Error'

  // Stubs and spies
  const cbSpy = sandbox.spy()
  sdkFacadeStub.callsFake((config, callback) => {
    callback(err)
  })

  // Execution
  connect.call(connector, cbSpy)

  // Tests
  t.ok(cbSpy.calledOnce)
  t.ok(cbSpy.calledWith(err))
  t.ok(sdkFacadeStub.calledOnce)
  t.equals(sdkFacadeStub.firstCall.args[0], connector.config)

  t.end()
})

test('### connect Call - OK Case ###', (t) => {
  // Data
  const sdkAPI = {}

  // Stubs and spies
  const cbSpy = sandbox.spy()
  sdkFacadeStub.callsFake((config, callback) => {
    callback(null, sdkAPI)
  })

  // Execution
  connect.call(connector, cbSpy)

  // Tests
  t.ok(cbSpy.calledOnce)
  t.ok(cbSpy.calledWith())
  t.ok(sdkFacadeStub.calledTwice)
  t.equals(sdkFacadeStub.firstCall.args[0], connector.config)
  t.equals(connector.sdkAPI, sdkAPI)

  t.end()
})

test('### Stop Arrow ###', (t) => {
  mockery.disable()
  arrow.stop(function () {
    t.pass('Arrow has been stopped!')
    t.end()
  })
})