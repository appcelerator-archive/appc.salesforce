'use strict'

const sinon = require('sinon')
const tap = require('tap')
const test = tap.test
const deleteOne = require('../../../lib/methods/delete')['delete']
const server = require('../../server')
const utils = require('../../../lib/utils/index')

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
                sobject: { deleteOne: () => { } }
            }
            Model = arrow.getModel('Posts')
            t.ok(arrow, 'Arrow has been started')
            t.end()
        })
        .catch((err) => {
            t.threw(err)
        })
})

test('## delete unit test - Error Case try/catch ###', function (t) {
    // Data
    const err = { message: 'Error' }
    const instance = { getPrimaryKey: () => { } }

    // Stubs and spies
    const cbErrorSpy = sandbox.spy()
    const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
        return { nameOnly: 'Account' }
    })
    const deleteOneStub = sandbox.stub(connector.sdkAPI.sobject, 'deleteOne').throws(err)

    // Execution
    deleteOne.call(connector, Model, instance, cbErrorSpy)

    // Tests
    t.ok(cbErrorSpy.calledOnce)
    t.ok(cbErrorSpy.calledWith(err))
    t.ok(deleteOneStub.calledOnce)
    t.equals(deleteOneStub.firstCall.args[0], 'Account')
    t.ok(getRootModelNameStub.calledOnce)
    t.ok(getRootModelNameStub.calledWith(Model))

    t.end()
})

test('## delete unit test - Error Case ###', function (t) {
    // Data
    const instance = {
        name: 'Test Name',
        getPrimaryKey: () => { }
    }

    // Stubs and spies
    const cbErrorSpy = sandbox.spy()
    const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
        return { nameOnly: 'Account' }
    })
    const deleteOneStub = sandbox.stub(connector.sdkAPI.sobject, 'deleteOne').callsFake((modelName, instancePrKey, callback) => {
        callback('Some error')
    })
    const parseErrorStub = sandbox.stub(utils, 'parseError').callsFake((err) => {
        return 'Parsed error'
    })

    // Execution
    deleteOne.call(connector, Model, instance, cbErrorSpy)

    // Tests
    t.ok(cbErrorSpy.calledOnce)
    t.ok(cbErrorSpy.calledWith('Parsed error'))
    t.ok(deleteOneStub.calledOnce)
    t.equals(deleteOneStub.firstCall.args[0], 'Account')
    t.ok(getRootModelNameStub.calledOnce)
    t.ok(getRootModelNameStub.calledWith(Model))
    t.ok(parseErrorStub.calledOnce)
    t.ok(parseErrorStub.calledWith('Some error'))

    t.end()
})

test('## delete unit test - OK Case ###', function (t) {
    // Data
    const instance = {
        name: 'Test Name',
        getPrimaryKey: () => { }
    }

    // Stubs and spies
    const cbErrorSpy = sandbox.spy()
    const getRootModelNameStub = sandbox.stub(connector.tools, 'getRootModelName').callsFake((Model) => {
        return { nameOnly: 'Account' }
    })
    const deleteOneStub = sandbox.stub(connector.sdkAPI.sobject, 'deleteOne').callsFake((modelName, instancePrKey, callback) => {
        callback(null, {})
    })

    // Execution
    deleteOne.call(connector, Model, instance, cbErrorSpy)

    // Tests
    t.ok(cbErrorSpy.calledOnce)
    t.ok(cbErrorSpy.calledWith(null, instance))
    t.ok(deleteOneStub.calledOnce)
    t.equals(deleteOneStub.firstCall.args[0], 'Account')
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