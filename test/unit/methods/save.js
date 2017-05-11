'use strict'

const sinon = require('sinon')
const tap = require('tap')
const test = tap.test
const save = require('../../../lib/methods/save').save
const server = require('../../server')
const utils = require('../../../lib/utils/index')
const _ = require('lodash')

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
                sobject: { update: () => { } }
            }
            Model = arrow.getModel('Posts')
            t.ok(arrow, 'Arrow has been started')
            t.end()
        })
        .catch((err) => {
            t.threw(err)
        })
})

test('## save unit test - Error Case try/catch ###', function (t) {
    // Data
    const instance = {
        getPrimaryKey: () => { },
        toPayload: () => { }
    }
    const err = { message: 'Error' }

    // Stubs and spies
    const cbErrorSpy = sandbox.spy()
    const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
        return { nameOnly: 'Account' }
    })
    const updateStub = sandbox.stub(connector.sdkAPI.sobject, 'update').throws(err)
    const lodashStub = sandbox.stub(_, 'merge').callsFake((obj, instance) => {
        return {}
    })
    // Execution
    save.call(connector, Model, instance, cbErrorSpy)

    // Tests
    t.ok(cbErrorSpy.calledOnce)
    t.ok(cbErrorSpy.calledWith(err))
    t.ok(updateStub.calledOnce)
    t.ok(lodashStub.calledOnce)
    t.ok(getRootModelNameStub.calledOnce)
    t.ok(getRootModelNameStub.calledWith(Model))

    t.end()
})

test('## save unit test - Error Case ###', function (t) {
    // Data
    const instance = {
        getPrimaryKey: () => { },
        toPayload: () => { }
    }

    // Stubs and spies
    const cbOkSpy = sandbox.spy()
    const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
        return { nameOnly: 'Account' }
    })
    const updateStub = sandbox.stub(connector.sdkAPI.sobject, 'update').callsFake((modelName, payload, callback) => {
        callback('Some error')
    })
    const lodashStub = sandbox.stub(_, 'merge').callsFake((obj, instance) => {
        return {}
    })
    const parseErrorStub = sandbox.stub(utils, 'parseError').callsFake((err) => {
        return 'Parsed error'
    })

    // Execution
    save.call(connector, Model, instance, cbOkSpy)

    // Tests
    t.ok(cbOkSpy.calledOnce)
    t.ok(cbOkSpy.calledWith('Parsed error'))
    t.ok(updateStub.calledOnce)
    t.equals(updateStub.firstCall.args[0], 'Account')
    t.ok(lodashStub.calledOnce)
    t.ok(getRootModelNameStub.calledOnce)
    t.ok(getRootModelNameStub.calledWith(Model))
    t.ok(parseErrorStub.calledOnce)
    t.ok(parseErrorStub.calledWith('Some error'))

    t.end()
})

test('## save unit test - OK Case ###', function (t) {
    // Data
    const instance = {
        getPrimaryKey: () => { },
        toPayload: () => { }
    }

    // Stubs and spies
    const cbErrorSpy = sandbox.spy()
    const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
        return { nameOnly: 'Account' }
    })
    const updateStub = sandbox.stub(connector.sdkAPI.sobject, 'update').callsFake((modelName, payload, callback) => {
        const result = { id: '1234' }
        callback(null, result)
    })
    const lodashStub = sandbox.stub(_, 'merge').callsFake((obj, instance) => {
        return {}
    })
    const findOneStub = sandbox.stub(connector, 'findOne').callsFake((Model, id, callback) => {
        callback(null, {})
    })

    // Execution
    save.call(connector, Model, instance, cbErrorSpy)

    // Tests
    t.ok(cbErrorSpy.calledOnce)
    t.ok(cbErrorSpy.calledWith(null, {}))
    t.ok(updateStub.calledOnce)
    t.ok(lodashStub.calledOnce)
    t.ok(findOneStub.calledOnce)
    t.equals(findOneStub.firstCall.args[0], Model)
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