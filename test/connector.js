/* global Arrow, connector, server */
var base = require('./_base'),
	should = require('should'),
	assert = require('assert'),
	async = require('async'),
	request = require('request'),
	path = require('path');

describe('Connector', function () {
	var Model;

	before(function (next) {
		Model = Arrow.Model.extend('Account', {
			fields: {
				Name: {type: String, required: false, validator: /[a-zA-Z]{3,}/},
				Type: {type: String, readonly: true}
			},
			connector: 'appc.salesforce'
		});

		should(Model).be.an.object;
		should(Model.generated).be.false;

		deleteTestData(next);
	});

	after(function (next) {
		deleteTestData(next);
	});

	it('should be able to fetch metadata', function (next) {
		connector.fetchMetadata(function (err, meta) {
			should(err).be.not.ok;
			should(meta).be.an.object;
			should(Object.keys(meta)).containEql('fields');
			next();
		});
	});

	it('should be able to fetch schema', function (next) {
		connector.fetchSchema(function (err, schema) {
			should(err).be.not.ok;
			should(schema).be.an.Object;
			next();
		});
	});

	it('should create models from schema', function () {
		var Contract = connector.getModel('appc.salesforce/Contract');
		should(Contract).be.ok;
		should(Contract.generated).be.true;
	});

	it('should be able to create instance', function (next) {

		var name = 'TEST: Hello world',
			object = {
				Name: name
			};

		Model.create(object, function (err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.Object;
			should(instance.getPrimaryKey()).be.a.String;
			should(instance.Name).equal(name);
			instance.delete(next);
		});

	});

	it('should be able to findAll', function (next) {

		Model.findAll(function (err, coll) {
			should(err).be.not.ok;
			should(coll).be.ok;
			should(coll.length).be.within(1, 1000);
			next();
		});

	});

	it('should be able to map fields', function (next) {

		var Model = Arrow.Model.extend('Account', {
			fields: {
				SuperName: {name: 'Name', type: String}
			},
			connector: 'appc.salesforce'
		});
		var name = 'TEST: Hello world',
			object = {
				SuperName: name
			};

		Model.create(object, function (err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.object;
			should(instance.SuperName).equal(name);
			instance.delete(next);
		});

	});

	it('should be able to find an instance by ID', function (next) {

		var name = 'TEST: Hello world',
			object = {
				Name: name
			};

		Model.create(object, function (err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.object;

			var id = instance.getPrimaryKey();
			Model.find(id, function (err, instance2) {
				should(err).be.not.ok;
				should(instance2).be.an.object;
				should(instance2.getPrimaryKey()).equal(id);
				should(instance2.Name).equal(name);
				instance.delete(next);
			});

		});

	});

	it('should be able to find an instance by field value', function (next) {

		var name = 'TEST: Hello world',
			object = {
				Name: name
			};

		Model.create(object, function (err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.object;

			var options = {Name: name};
			Model.find(options, function (err, coll) {
				should(err).be.not.ok;
				shouldContain(coll, instance);
				instance.delete(next);
			});

		});

	});

	it('should be able to find an instance by field comparison', function (next) {

		var name = 'TEST: Hello world',
			object = {
				Name: name
			};

		Model.create(object, function (err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.object;

			var options = {where: {Name: {$like: name.split(' ')[0] + '%'}}};
			Model.query(options, function (err, coll) {
				should(err).be.not.ok;
				shouldContain(coll, instance);
				instance.delete(next);
			});

		});

	});

	it('should be able to order, limit, skip while finding', function (next) {

		var name = 'TEST: Hello world',
			limit = 3,
			object = {
				Name: name
			};

		Model.create(object, function (err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.object;

			var options = {
				where: {Name: {$like: 'TEST: Hello %'}},
				sel: {Id: 1, Name: 1},
				order: {Id: 1, Name: 1},
				limit: limit,
				skip: 0
			};
			Model.query(options, function (err, coll) {
				should(err).be.not.ok;
				should(coll.length).be.below(limit + 1);
				shouldContain(coll, instance);
				instance.delete(next);
			});

		});

	});

	it('should be able to update an instance', function (next) {

		var name = 'TEST: Hello world',
			object = {
				Name: name
			};

		Model.create(object, function (err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.object;

			var id = instance.getPrimaryKey();
			Model.findOne(id, function (err, instance2) {
				should(err).be.not.ok;

				var newName = 'TEST: Goodbye world';
				instance2.set('Name', newName);
				instance2.save(function (err, result) {
					should(err).be.not.ok;

					should(result).be.an.object;
					should(result.getPrimaryKey()).equal(id);
					should(result.Name).equal(newName);
					instance.delete(next);
				});

			});

		});

	});

	it('API-377: should be able to query with just skip', function (callback) {
		Model.query({}, function (err, coll1) {
			should(err).be.not.ok;
			should(coll1).be.ok;
			Model.query({skip: 1}, function (err, coll2) {
				should(err).be.not.ok;
				should(coll2).be.ok;
				callback();
			});
		});
	});

	(connector.config.username === 'luuwilson@gmail.com' ? it : it.skip)('API-594: should error transparently when you try to $like query on a textarea', function (callback) {
		var Model = Arrow.createModel('salesforce__c', {
			fields: {
				fname: {type: String, required: true, name: 'First_Name__c'},
				lname: {type: String, required: true, name: 'Last_Name__c'},
				email: {type: String, required: true, name: 'Email__c'}
			},
			connector: 'appc.salesforce'
		});
		Model.create([
			{fname: 'Fergie', lname: 'Flintstone', email: 'fergie@flintstones.com'},
			{fname: 'Wally', lname: 'West', email: 'flash@centralcity.com'},
			{fname: 'Bruce', lname: 'Wayne', email: 'batman@gotham.com'}
		], created);

		function created(err) {
			should(err).be.not.ok;
			Model.query({where: {fname: {$like: "%a%"}}}, queried);
		}

		function queried(err) {
			should(err).be.ok;
			should(err).containEql('can not be filtered in query call');
			callback();
		}
	});

	describe('API-30: per-request auth', function () {
		var auth = {
				user: server.config.apikey,
				password: ''
			},
			accessToken,
			instanceUrl,
			urlToHit;

		before(function (cb) {
			connector.config.requireSessionLogin = true;
			connector.config.generateModels = ['account'];
			server.start(function (err) {
				urlToHit = 'http://localhost:' + server.port + '/api/appc.salesforce/account/query?limit=2';
				assert.ifError(err);
				cb();
			});
		});

		it('should make sure auth is required', function makeSureAuthIsRequired(cb) {
			request({
				method: 'GET',
				uri: urlToHit,
				auth: auth,
				json: true
			}, function (err, response, body) {
				should(body.success).be.false;
				should(body.message).containEql('Authentication is required. Please pass these headers:');
				cb();
			});
		});

		it('should pass with valid auth params', function passGoodAuth(cb) {
			request({
				method: 'GET',
				uri: urlToHit,
				auth: auth,
				headers: {
					user: connector.config.username,
					pass: connector.config.password,
					token: connector.config.token
				},
				json: true
			}, function (err, response, body) {
				should(body.success).be.true;
				should(response.headers.accesstoken).be.ok;
				accessToken = response.headers.accesstoken;
				instanceUrl = response.headers.instanceurl;
				cb();
			});
		});

		it('should pass with valid access token', function passGoodAccessToken(cb) {
			request({
				method: 'GET',
				uri: urlToHit,
				auth: auth,
				headers: {
					accessToken: accessToken,
					instanceUrl: instanceUrl
				},
				json: true
			}, function (err, response, body) {
				should(body.success).be.true;
				cb();
			});
		});

		it('should error with invalid access token', function passInvalidAccessToken(cb) {
			request({
				method: 'GET',
				uri: urlToHit,
				auth: auth,
				headers: {
					accessToken: 'bad-access-token!',
					instanceUrl: instanceUrl
				},
				json: true
			}, function (err, response, body) {
				should(body.success).be.false;
				should(body.message).containEql('Session expired or invalid');
				cb();
			});
		});

		it('should error with invalid auth params', function passInvalidAuth(cb) {
			request({
				method: 'GET',
				uri: urlToHit,
				auth: auth,
				headers: {
					user: 'bad-user!',
					pass: 'bad-pass!',
					token: 'go to your room!'
				},
				json: true
			}, function (err, response, body) {
				should(body.success).be.false;
				should(body.message).containEql('INVALID_LOGIN: Invalid username, password, security token');
				cb();
			});
		});

	});

	/*
	 Utility.
	 */

	function deleteTestData(next) {
		var temp = connector.config.requireSessionLogin;
		connector.config.requireSessionLogin = false;
		Model.query({where: {Name: {$like: 'TEST: %'}}, limit: 100}, function (err, coll) {
			should(err).be.not.ok;
			if (!coll) {
				return next();
			}
			async.eachSeries(coll, function (instance, proceed) {
				instance.delete(proceed);
			}, function () {
				connector.config.requireSessionLogin = temp;
				next();
			});
		});
	}

	function shouldContain(coll, instance) {
		should(coll).be.an.object;
		should(coll.length).be.above(0);
		var found = false;
		for (var i = 0; i < coll.length; i++) {
			var instance2 = coll[i];
			if (instance2.getPrimaryKey() === instance.getPrimaryKey()) {
				found = true;
				should(instance2.Name).equal(instance.Name);
			}
		}
		should(found).be.ok;
	}
});