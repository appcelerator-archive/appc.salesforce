'use strict'

const sandbox = require('sinon')
const tap = require('tap')
const test = tap.test
const identity = require('../../../lib/methods/identity').identity
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

test('## identity unit test - OK Case ###', function (t) {
    // Data
  connector.sdkAPI.identity = () => { }

    // Stubs and spies
  const cbOkSpy = sandbox.spy()
  const identityStub = sandbox.stub(connector.sdkAPI, 'identity').callsFake((callback) => { })

    // Execution
  identity.call(connector, cbOkSpy)

    // Tests
  t.ok(identityStub.calledOnce)

  t.end()
})

test('### Stop Arrow ###', (t) => {
  arrow.stop(function () {
    t.pass('Arrow has been stopped!')
    t.end()
  })
})
