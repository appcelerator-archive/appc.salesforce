'use strict'

const sinon = require('sinon')
const tap = require('tap')
const _ = require('lodash')
const test = tap.test
const transformer = require('../../../lib/utils/transformer')
const utils = require('../../../lib/utils/index')
const sandbox = sinon.sandbox

tap.beforeEach((done) => {
  sandbox.create()
  done()
})

tap.afterEach((done) => {
  sandbox.restore()
  done()
})

test('## transformer - OK Case ###', function (t) {
  const connectorName = 'appc.salesforce.1'
  const sObjectMetadata = {
    Account: {}
  }
  const convertDataTypeToJSTypeStub = sandbox.stub(utils, 'convertDataTypeToJSType').callsFake((field, objectName) => {
    return {}
  })
  const lodashObjectStub = sandbox.stub(_, 'object').callsFake((arr) => { return [] })
  const lodashMapStub = sandbox.stub(_, 'map').callsFake((collection, callback) => {
    const currentObject = {
      name: 'Account',
      fields: [
        {
          name: 'Id'
        }, {
          name: 'AccountId',
          defaultValue: 'string'
        },
        {
          name: 'AccountId',
          nillable: null,
          defaultValue: null,
          updateable: true
        }]
    }
    const key = 'Account'
    callback(currentObject, key)
  })

  const transformData = transformer(connectorName, sObjectMetadata)

  t.ok(transformData['Account'].name, 'Account')
  t.ok(convertDataTypeToJSTypeStub.calledTwice)
  t.ok(lodashObjectStub.calledOnce)
  t.ok(lodashMapStub.calledOnce)

  t.end()
})
