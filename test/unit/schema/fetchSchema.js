'use strict'

const sandbox = require('sinon')
const tap = require('tap')
const test = tap.test
const fetchSchema = require('../../../lib/schema/fetchSchema').fetchSchema

test('## fetchSchema unit test - OK Case ###', function (t) {
    // Stubs and spies
  sandbox.createSandbox()
  const cbOkSpy = sandbox.spy()

    // Execution
  fetchSchema(cbOkSpy)

    // Tests
  t.ok(cbOkSpy.calledOnce)
  sandbox.restore()
  t.end()
})
