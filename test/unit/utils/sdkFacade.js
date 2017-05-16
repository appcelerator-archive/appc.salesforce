'use strict'

const sinon = require('sinon')
const tap = require('tap')
const test = tap.test
const jsforce = require('jsforce')
const async = require('async')
const sandbox = sinon.sandbox
const mockery = require('mockery')

const jsforceStub = sandbox.stub()

// mockery.enable({
// 	warnOnReplace: false,
// 	warnOnUnregistered: false
// })

// const asyncMock = sandbox.stub()
// mockery.registerMock('async', asyncMock)

const sdkFacade = require('../../../lib/utils/sdkFacade')

tap.beforeEach((done) => {
	sandbox.create()
	done()
})

tap.afterEach((done) => {
	sandbox.restore()
	done()
})

test('## sdkFacade - Error Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback('Some error') }
		}

		return connection
	})

	sdkFacade.call(null, options, cbSpy)
	t.ok(cbSpy.calledOnce)
	t.ok(cbSpy.calledWith('Some error'))
	t.ok(jsforceStub.calledOnce)

	t.end()
})

test('## sdkFacade - Ok Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) }
		}

		return connection
	})

	sdkFacade.call(null, options, cbSpy)
	t.ok(cbSpy.calledOnce)
	t.ok(jsforceStub.calledOnce)

	t.end()
})

test('## logout - Ok Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			logout: (callback) => { callback(null, {}) }
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		const cbOkSpy = sandbox.spy()
		connection.logout(cbOkSpy)
		t.ok(cbOkSpy.calledOnce)
		t.ok(cbOkSpy.calledWith(null, {}))
		t.ok(jsforceStub.calledOnce)

		t.end()
	})

})

test('## getSalesforceData - Error Case throw error from describeGlobal ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}

	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			getSalesforceData: (options, callback) => { callback(null, {}) },
			describeGlobal: (callback) => { callback('Some error') }
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		const cbOkSpy = sandbox.spy()
		connection.getSalesforceData(options, cbOkSpy)
		t.ok(cbOkSpy.calledOnce)
		t.ok(cbOkSpy.calledWith('Some error'))
		t.ok(jsforceStub.calledOnce)

		t.end()
	})

})

test('## getSalesforceData - Error Case throw error from async ###', function (t) {
	const options = {
		url: "https://localhost:8080",
		generateModels: ['Account', 'Case']
	}

	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			getSalesforceData: (options, callback) => { callback(null, {}) },
			describeGlobal: (callback) => {
				const result = {
					sobjects: [
						{
							name: "FirstName",
							deprecatedAndHidden: true
						},
						{
							name: "AcceptedEventRelation",
							deprecatedAndHidden: false
						}
					]
				}
				callback(null, result)
			},
			describe: (sObjectName, callback) => {
				callback(null, {})
			}
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		const cbOkSpy = sandbox.spy()
		const asyncStub = sandbox.stub(async, 'parallelLimit').yields('Error in async')
		connection.getSalesforceData(options, cbOkSpy)
		t.ok(cbOkSpy.calledOnce)
		t.ok(cbOkSpy.calledWith('Error in async'))
		t.ok(jsforceStub.calledOnce)
		t.ok(asyncStub.calledOnce)

		t.end()
	})
})

test('## getSalesforceData - OK Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}

	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			getSalesforceData: (options, callback) => { callback(null, {}) },
			describeGlobal: (callback) => {
				const result = {
					sobjects: [
						{
							name: "FirstName",
							deprecatedAndHidden: true
						},
						{
							name: "AcceptedEventRelation",
							deprecatedAndHidden: false
						}
					]
				}
				callback(null, result)
			},
			describe: (sObjectName, callback) => {
				callback(null, {})
			}
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		const cbOkSpy = sandbox.spy()
		// const arr = [(next) => { callback(null, {}) }, (err) => { callback(null, {}) }]
		// asyncMock.yields(arr, 100, (err) => { callback(null, {}) })
		const asyncStub = sandbox.stub(async, 'parallelLimit').yields(null)
		connection.getSalesforceData(options, cbOkSpy)
		t.ok(cbOkSpy.calledOnce)
		t.ok(cbOkSpy.calledWith(null, {}))
		t.ok(jsforceStub.calledOnce)
		t.ok(asyncStub.calledOnce)

		t.end()
	})


})

test('## query - Ok Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			query: (stringQuery, callback) => { callback(null, {}) }
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		const cbOkSpy = sandbox.spy()
		connection.query('queryString', cbOkSpy)
		t.ok(cbOkSpy.calledOnce)
		t.ok(cbOkSpy.calledWith(null, {}))
		t.ok(jsforceStub.calledOnce)

		t.end()
	})

})

test('## search - Ok Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			search: (sosl, callback) => { callback(null, {}) }
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		const cbOkSpy = sandbox.spy()
		connection.search('FIND {Un*} IN ALL FIELDS RETURNING Account(Id, Name), Lead(Id, Name)', cbOkSpy)
		t.ok(cbOkSpy.calledOnce)
		t.ok(cbOkSpy.calledWith(null, {}))
		t.ok(jsforceStub.calledOnce)

		t.end()
	})

})

test('## identity - Ok Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			identity: (callback) => { callback(null, {}) }
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		const cbOkSpy = sandbox.spy()
		connection.identity(cbOkSpy)
		t.ok(cbOkSpy.calledOnce)
		t.ok(cbOkSpy.calledWith(null, {}))
		t.ok(jsforceStub.calledOnce)

		t.end()
	})

})

test('## limitInfo - Ok Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			limitInfo: () => { }
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		connection.limitInfo()
		t.ok(jsforceStub.calledOnce)

		t.end()
	})

})

test('## retrieve - Ok Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			sobject: (modelName) => {
				return { retrieve: (id, callback) => { callback(null, {}) } }
			}
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		const cbOkSpy = sandbox.spy()
		connection.sobject.findByID('Account', '1234', cbOkSpy)
		t.ok(cbOkSpy.calledOnce)
		t.ok(cbOkSpy.calledWith(null, {}))
		t.ok(jsforceStub.calledOnce)

		t.end()
	})

})

test('## create - Ok Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			sobject: (modelName) => {
				return { create: (payload, callback) => { callback(null, {}) } }
			}
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		const cbOkSpy = sandbox.spy()
		connection.sobject.create('Account', {}, cbOkSpy)
		t.ok(cbOkSpy.calledOnce)
		t.ok(cbOkSpy.calledWith(null, {}))
		t.ok(jsforceStub.calledOnce)

		t.end()
	})

})

test('## update - Ok Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			sobject: (modelName) => {
				return { update: (record, callback) => { callback(null, {}) } }
			}
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		const cbOkSpy = sandbox.spy()
		connection.sobject.update('Account', {}, cbOkSpy)
		t.ok(cbOkSpy.calledOnce)
		t.ok(cbOkSpy.calledWith(null, {}))
		t.ok(jsforceStub.calledOnce)

		t.end()
	})

})

test('## destroy - Ok Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			sobject: (modelName) => {
				return { destroy: (id, callback) => { callback(null, {}) } }
			}
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		const cbOkSpy = sandbox.spy()
		connection.sobject.deleteOne('Account', {}, cbOkSpy)
		t.ok(cbOkSpy.calledOnce)
		t.ok(cbOkSpy.calledWith(null, {}))
		t.ok(jsforceStub.calledOnce)

		t.end()
	})

})

test('## find - Ok Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			sobject: (modelName) => {
				return { find: (condition) => { } }
			}
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		const cbOkSpy = sandbox.spy()
		connection.sobject.find('Account', 'Some condition')
		t.ok(jsforceStub.calledOnce)

		t.end()
	})

})

test('## limit - Ok Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			sobject: {}
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		const cbOkSpy = sandbox.spy()
		const obj = {
			limit: (num) => { return num }
		}
		const limit = connection.sobject.limit(obj, 5)
		t.equals(limit, 5)
		t.ok(jsforceStub.calledOnce)

		t.end()
	})

})

test('## skip - Ok Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			sobject: {}
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		const cbOkSpy = sandbox.spy()
		const obj = {
			skip: (num) => { return num }
		}
		const skip = connection.sobject.skip(obj, 5)
		t.equals(skip, 5)
		t.ok(jsforceStub.calledOnce)

		t.end()
	})

})

test('## sort - Ok Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			sobject: {}
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		const cbOkSpy = sandbox.spy()
		const obj = {
			sort: (condition) => { return condition }
		}
		const sort = connection.sobject.sort(obj, 'Some condition')
		t.equals(sort, 'Some condition')
		t.ok(jsforceStub.calledOnce)

		t.end()
	})

})

test('## execute - Ok Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			sobject: {}
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		const cbOkSpy = sandbox.spy()
		const obj = {
			execute: (callback) => { callback(null, {}) }
		}
		connection.sobject.execute(obj, cbOkSpy)
		t.ok(cbOkSpy.calledOnce)
		t.ok(cbOkSpy.calledWith(null, {}))
		t.ok(jsforceStub.calledOnce)

		t.end()
	})

})

test('## resource - Ok Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			chatter: { resource: (resource) => { } }
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		connection.chatter.resource({})
		t.ok(jsforceStub.calledOnce)

		t.end()
	})

})

test('## apex - Ok Case ###', function (t) {
	const options = {
		url: "https://localhost:8080"
	}
	const cbSpy = sandbox.spy()
	const jsforceStub = sandbox.stub(jsforce, 'Connection').callsFake((opts) => {
		const connection = {
			login: (username, password, callback) => { callback(null, {}) },
			apex: { post: (path, body, callback) => { callback(null, {}) } }
		}

		return connection
	})

	const sdk = sdkFacade(options, (err, connection) => {
		const cbOkSpy = sandbox.spy()
		connection.apex('post', 'path', 'body', cbOkSpy)
		t.ok(cbOkSpy.calledOnce)
		t.ok(cbOkSpy.calledWith(null, {}))
		t.ok(jsforceStub.calledOnce)

		t.end()
	})

})


mockery.disable()