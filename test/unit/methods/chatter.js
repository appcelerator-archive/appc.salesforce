'use strict'

const sandbox = require('sinon')
const tap = require('tap')
const test = tap.test
const _ = require('lodash')
const chatter = require('../../../lib/methods/chatter').chatter
const server = require('../../server')


var arrow
var connector

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
          connector.sdkAPI = {}
          t.ok(arrow, 'Arrow has been started')
          t.end()
        })
        .catch((err) => {
          t.threw(err)
        })
})

test('## chatter unit test - OK Case  with function ###', function (t) {
    // Data
  connector.sdkAPI.chatter = {
    resource: () => { }
  }
  const params = () => { }

    // Stubs and spies
  const cbOkSpy = sandbox.spy()
  const chatterStub = sandbox.stub(connector.sdkAPI.chatter, 'resource').callsFake((resource) => {
    return {
      get: { apply: (scope, args) => { } }
    }
  })
  const lodashStub = sandbox.stub(_, 'isFunction').callsFake((body) => { return true })

    // Execution
  chatter.call(connector, 'get', '/users', params, cbOkSpy)

    // Tests
  t.ok(lodashStub.calledOnce)
  t.ok(chatterStub.calledOnce)
  t.ok(chatterStub.calledWith('/users'))

  t.end()
})

test('## chatter unit test - OK Case  without function ###', function (t) {
    // Data
  connector.sdkAPI.chatter = {
    resource: () => { }
  }
  const params = () => { }

    // Stubs and spies
  const cbOkSpy = sandbox.spy()
  const chatterStub = sandbox.stub(connector.sdkAPI.chatter, 'resource').callsFake((resource) => {
    return {
      get: { apply: (scope, args) => { } }
    }
  })
  const lodashStub = sandbox.stub(_, 'isFunction').callsFake((body) => { return false })

    // Execution
  chatter.call(connector, 'get', '/users', params, cbOkSpy)

    // Tests
  t.ok(lodashStub.calledOnce)
  t.ok(chatterStub.calledOnce)
  t.ok(chatterStub.calledWith('/users'))

  t.end()
})

test('### Stop Arrow ###', (t) => {
  arrow.stop(function () {
    t.pass('Arrow has been stopped!')
    t.end()
  })
})
