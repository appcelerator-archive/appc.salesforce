'use strict'

const sinon = require('sinon')
const tap = require('tap')
const test = tap.test
const mockery = require('mockery')
const server = require('../../server')

const sandbox = sinon.sandbox

mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
})

const transformerStub = sinon.stub()
mockery.registerMock('../utils/transformer', transformerStub);

const createModelsFromSchema = require('../../../lib/schema/createModelsFromSchema').createModelsFromSchema

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
            connector.tools = { load: { models: (data) => { } } }
            connector.sdkAPI = {
                getSalesforceData: (config, callback) => { }
            }
            Model = arrow.getModel('Posts')
            t.ok(arrow, 'Arrow has been started')
            t.end()
        })
        .catch((err) => {
            t.threw(err)
        })
})

test('## createModelsFromSchema unit test - Error Case ###', function (t) {
    // Stubs and spies
    const cbOkSpy = sandbox.spy()
    const getSalesforceDataStub = sandbox.stub(connector.sdkAPI, 'getSalesforceData').callsFake((config, callback) => {
        callback('Some error')
    })

    // Execution
    createModelsFromSchema.call(connector, cbOkSpy)

    // Tests
    t.ok(cbOkSpy.calledOnce)
    t.ok(cbOkSpy.calledWith('Some error'))
    t.ok(getSalesforceDataStub.calledOnce)

    t.end()
})


test('## createModelsFromSchema unit test - OK Case ###', function (t) {
    // Stubs and spies
    const cbOkSpy = sandbox.spy()
    const getSalesforceDataStub = sandbox.stub(connector.sdkAPI, 'getSalesforceData').callsFake((config, callback) => {
        callback(null, {})
    })

    const loadModelsStub = sandbox.stub(connector.tools.load, 'models').callsFake((getSalesforceDataStub) => {})

    // Execution
    createModelsFromSchema.call(connector, cbOkSpy)

    // Tests
    t.ok(cbOkSpy.calledOnce)
    t.ok(cbOkSpy.calledWith())
    t.ok(getSalesforceDataStub.calledOnce)
    t.ok(loadModelsStub.calledOnce)
    t.ok(transformerStub.calledOnce)

    t.end()
})

test('### Stop Arrow ###', (t) => {
    mockery.disable()
    arrow.stop(function () {
        t.pass('Arrow has been stopped!')
        t.end()
    })
})