var should = require('should'),
	async = require('async'),
	ConnectorFactory = require('../lib'),
	APIBuilder = require('apibuilder'),
	Connector = ConnectorFactory.create(APIBuilder),
	Loader = APIBuilder.Loader,
	config = new Loader('../conf'),
	connector = new Connector(config),
	Model;

describe('Connector', function() {

	before(function(next) {
		Model = APIBuilder.createModel('Account', {
			fields: {
				Name: { type: 'string', required: false, validator: /[a-zA-Z]{3,}/ },
				Type: { type: 'string', readonly: true },
				AccountSource: { type: 'string' }
			},
			connector: connector	// a model level connector
		});

		should(Model).be.an.object;

		connector.connect(function () {
			deleteTestData(next);
		});
	});

	after(function(next) {
		deleteTestData(function() {
			connector.disconnect(next);
		});
	});

	it('should be able to fetch metadata', function(next) {
		connector.fetchMetadata(function(err, meta) {
			should(err).be.not.ok;
			should(meta).be.an.object;
			should(Object.keys(meta)).containEql('fields');
			next();
		});
	});

	it('should be able to fetch schema', function(next) {
		connector.fetchSchema(function(err, schema) {
			should(err).be.not.ok;
			should(schema).be.an.object;
			next();
		});
	});

	it('should be able to create instance', function(next) {

		var name = 'TEST: Hello world',
			object = {
				Name: name
			};

		Model.create(object, function(err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.object;
			should(instance.getPrimaryKey()).be.a.String;
			should(instance.Name).equal(name);
			should(instance.AccountSource).be.ok;
			instance.delete(next);
		});

	});

	it('should be able to find an instance by ID', function(next) {

		var name = 'TEST: Hello world',
			object = {
				Name: name
			};

		Model.create(object, function(err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.object;

			var id = instance.getPrimaryKey();
			Model.find(id, function(err, instance2) {
				should(err).be.not.ok;
				should(instance2).be.an.object;
				should(instance2.getPrimaryKey()).equal(id);
				should(instance2.Name).equal(name);
				should(instance2.AccountSource).be.ok;
				instance.delete(next);
			});

		});

	});

	it('should be able to find an instance by field value', function(next) {

		var name = 'TEST: Hello world',
			object = {
				Name: name
			};

		Model.create(object, function(err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.object;

			var options = { Name: name };
			Model.find(options, function(err, coll) {
				should(err).be.not.ok;
				shouldContain(coll, instance);
				instance.delete(next);
			});

		});

	});

	it('should be able to find an instance by field comparison', function(next) {

		var name = 'TEST: Hello world',
			object = {
				Name: name
			};

		Model.create(object, function(err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.object;

			var options = { where: { Name: { $like: name.split(' ')[0] + '%' } } };
			Model.query(options, function(err, coll) {
				should(err).be.not.ok;
				shouldContain(coll, instance);
				instance.delete(next);
			});

		});

	});

	it('should be able to sort, limit, skip while finding', function(next) {

		var name = 'TEST: Hello world',
			limit = 3,
			object = {
				Name: name
			};

		Model.create(object, function(err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.object;

			var options = {
				where: { Name: { $like: 'TEST: Hello %' } },
				sel: { Id: 1, Name: 1 },
				order: { Id: 1, Name: 1 },
				limit: limit,
				skip: 0
			};
			Model.query(options, function(err, coll) {
				should(err).be.not.ok;
				should(coll.length).be.below(limit + 1);
				shouldContain(coll, instance);
				instance.delete(next);
			});

		});

	});

	it('should be able to update an instance', function(next) {

		var name = 'TEST: Hello world',
			object = {
				Name: name
			};

		Model.create(object, function(err, instance) {
			should(err).be.not.ok;
			should(instance).be.an.object;

			var id = instance.getPrimaryKey();
			Model.findOne(id, function(err, instance2) {
				should(err).be.not.ok;

				var newName = 'TEST: Goodbye world';
				instance2.set('Name', newName);
				instance2.save(function(err, result) {
					should(err).be.not.ok;

					should(result).be.an.object;
					should(result.getPrimaryKey()).equal(id);
					should(result.Name).equal(newName);
					instance.delete(next);
				});

			});

		});

	});

	/*
	 Utility.
	 */

	function deleteTestData(next) {
		Model.find({ where: { Name: { $like: 'TEST: %' } }, limit: 100 }, function(err, coll) {
			should(err).be.not.ok;
			async.eachSeries(coll, function(instance, proceed) {
				instance.delete(proceed);
			}, function () {
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
