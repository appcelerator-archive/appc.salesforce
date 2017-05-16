const sinon = require('sinon')
const tap = require('tap')
const test = tap.test
const findOne = require('../../../lib/methods/findOne').findOne
const server = require('../../server')

const sandbox = sinon.sandbox

var arrow
var connector

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
    t.ok(arrow, 'Arrow has been started')
    t.end()
  })
  .catch((err) => {
    t.threw(err)
  })
})

test('FindOne with console.warn', function (t) {
  const logger = connector.logger

  // Stubs and spies
  const findByIdStub = sandbox.stub(connector.findByID, 'apply').callsFake((values) => { })
  connector.logger = false

  // Execution
  findOne.call(connector)

  // Tests
  t.ok(findByIdStub.calledOnce)

  connector.logger = logger
  t.end()
})

test('FindOne with logger', function (t) {
  // Stubs and spies
  const findByIdStub = sandbox.stub(connector.findByID, 'apply').callsFake((values) => { })
  const loggerStub = sandbox.stub(connector.logger, 'warn').callsFake(() => { })

  // Execution
  findOne.call(connector)

  // Tests
  t.ok(findByIdStub.calledOnce)
  t.ok(loggerStub.calledOnce)

  t.end()
})

test('### Stop Arrow ###', (t) => {
  arrow.stop(function () {
    t.pass('Arrow has been stopped!')
    t.end()
  })
})
