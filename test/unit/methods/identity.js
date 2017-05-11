'use strict'

const sinon = require('sinon')
const tap = require('tap')
const test = tap.test
const _ = require('lodash')
const identity = require('../../../lib/methods/identity').identity
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