'use strict'

const sinon = require('sinon')
const tap = require('tap')
const test = tap.test
const mockery = require('mockery')
const server = require('../../server')
var disconnect = require('../../../lib/lifecycle/disconnect').disconnect

const sandbox = sinon.sandbox

var arrow
var connector
var Model

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

test('### disconnect Call - OK Case ###', (t) => {
	// Data
	connector.sdkAPI = {
		logout: () => { }
	}

	// Stubs and spies
	const sandbox = sinon.sandbox.create()
	const cbSpy = sandbox.spy()
	const sdkAPIStub = sandbox.stub(connector.sdkAPI, 'logout').callsFake((callback) => {
		callback(null, {})
	})

	// Execution
	disconnect.call(connector, cbSpy)

	// Tests
	t.ok(cbSpy.calledOnce)
	t.ok(cbSpy.calledWith())
	t.ok(sdkAPIStub.calledOnce)
	t.equals(connector.sdkAPI, null)


	sandbox.restore()
	t.end()
})

test('### Stop Arrow ###', (t) => {
	arrow.stop(function () {
		t.pass('Arrow has been stopped!')
		t.end()
	})
})