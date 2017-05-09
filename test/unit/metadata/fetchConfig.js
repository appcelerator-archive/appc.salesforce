'use strict'

const tap = require('tap')
const test = tap.test
const server = require('../../server')
const fetchConfig = require('./../../../lib/metadata/fetchConfig').fetchConfig
const sinon = require('sinon')

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
			Model = arrow.getModel('Posts')
			t.ok(arrow, 'Arrow has been started')
			t.end()
		})
		.catch((err) => {
			t.threw(err)
		})
})

test('### fetchConfig test - OK Case with session login ###', (t) => {
	// Data
	connector.config.requireSessionLogin = true

	// Spy
	const cbSpy = sandbox.spy()

	// Execution
	fetchConfig.call(connector, cbSpy)

	// Tests 
	t.ok(cbSpy.calledOnce)
	t.ok(cbSpy.calledWith(null, connector.config))
	t.end()
})

test('### fetchConfig test - OK Case without session login ###', (t) => {
	// Data
	connector.config.requireSessionLogin = false

	// Spy
	const cbSpy = sandbox.spy()
	const message = 'config.requireSessionLogin is turned off; requests can use the global Salesforce authentication.'
	const loggerStub = sandbox.stub(connector.logger, 'debug').callsFake((message) => {
		return message
	})

	// Execution
	fetchConfig.call(connector, cbSpy)

	// Tests 
	t.ok(cbSpy.calledOnce)
	t.ok(cbSpy.calledWith(null, connector.config))
	t.ok(loggerStub.calledOnce)
	t.equals(loggerStub.firstCall.args[0], message)
	t.end()
})

test('### Stop Arrow ###', (t) => {
	arrow.stop(function () {
		t.pass('Arrow has been stopped!')
		t.end()
	})
})
