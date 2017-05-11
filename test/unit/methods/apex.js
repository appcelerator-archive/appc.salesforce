'use strict'

const sinon = require('sinon')
const tap = require('tap')
const test = tap.test
const _ = require('lodash')
const apex = require('../../../lib/methods/apex').apex
const server = require('../../server')

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
            connector.sdkAPI = {}
            Model = arrow.getModel('Posts')
            t.ok(arrow, 'Arrow has been started')
            t.end()
        })
        .catch((err) => {
            t.threw(err)
        })
})

test('## apex unit test - OK Case  with function ###', function (t) {
    // Data
    connector.sdkAPI.apex = () => { } 

    // Stubs and spies
    const cbOkSpy = sandbox.spy()
    const sdkAPIStub = sandbox.stub(connector.sdkAPI, 'apex').callsFake((verb, path, body, callback) => { })
    const lodashStub = sandbox.stub(_, 'isFunction').callsFake((body) => { return true })

    // Execution
    apex.call(connector, {}, '', {}, cbOkSpy)

    // Tests
    t.ok(lodashStub.calledOnce)
    t.ok(sdkAPIStub.calledOnce)
    t.ok(lodashStub.calledOnce)

    t.end()
})

test('## apex unit test - OK Case  without function ###', function (t) {
    // Data
    connector.sdkAPI.apex = () => { }

    // Stubs and spies
    const cbOkSpy = sandbox.spy()
    const sdkAPIStub = sandbox.stub(connector.sdkAPI, 'apex').callsFake((verb, path, body, callback) => { })
    const lodashStub = sandbox.stub(_, 'isFunction').callsFake((body) => { return false })

    // Execution
    apex.call(connector, {}, '', {}, cbOkSpy)

    // Tests
    t.ok(lodashStub.calledOnce)
    t.ok(sdkAPIStub.calledOnce)
    t.ok(lodashStub.calledOnce)

    t.end()
})

test('### Stop Arrow ###', (t) => {
    arrow.stop(function () {
        t.pass('Arrow has been stopped!')
        t.end()
    })
})