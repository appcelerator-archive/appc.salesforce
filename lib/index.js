var fs = require('fs'),
	path = require('path'),
	_ = require('lodash'),
	jsforce = require('jsforce'),
	crypto = require('crypto'),
	pkginfo = require('pkginfo')(module) && module.exports,
	defaultConfig = require('fs').readFileSync(__dirname + '/../conf/example.config.js', 'utf8'),
	moment = require('moment'),
	tmpdir = require('os').tmpdir();


// --------- Salesforce Connector -------

exports.create = function(Arrow, server) {

	var Connector = Arrow.Connector,
		Collection = Arrow.Collection;

	return Connector.extend({
		/*
		 Configuration.
		 */
		pkginfo: _.pick(pkginfo, 'name', 'version', 'description', 'author', 'license', 'keywords', 'repository'),
		logger: server && server.logger || Arrow.createLogger({}, { name: pkginfo.name }),

		/*
		 Lifecycle.
		 */
		connect: function connect(next) {
			if (this.config.enabled === false) {
				return next();
			}
			var opts = getOpts(this.config),
				username = this.config.username,
				password = this.config.password + this.config.token;

			if (!username) {
				return next(new Error('Missing required '+this.name+' connector configuration. Make sure you add your configuration to your config file in ./conf'));
			}

			this.baseContext = this;
			this.baseConnection = new jsforce.Connection(opts);
			this.baseConnection.login(username, password, function connectLoginCallback(err, userInfo) {
				if (err) { return next(parseError(err)); }
				else { return next(); }
			}.bind(this));
		},
		loginRequired: function loginRequired(request, next) {
			if (!request.headers || !request.headers.accesstoken) {
				next(null, true);
			}
			else {
				var headers = request.headers || {},
					opts = getOpts(this.config, headers);

				this.connection = this.baseContext.connection = new jsforce.Connection(opts);
				next(null, false);
			}
		},
		login: function login(request, response, next) {
			var headers = request.headers || {},
				opts = getOpts(this.config, headers),
				username = headers.user,
				password = headers.pass + headers.token;

			if (!headers.user || !headers.pass || !headers.token) {
				if (this.config.requireSessionLogin) {
					return next('Authentication is required. Please pass these headers: user, pass, and token; or accessToken.');
				}
				else {
					return next();
				}
			}
			
			this.connection = this.baseContext.connection = new jsforce.Connection(opts);
			this.connection.login(username, password, function loginCallback(err, userInfo) {
				if (err) {
					this.connection = this.baseContext.connection = null;
					return next(parseError(err));
				}
				
				response.header('accessToken', this.connection.accessToken);
				response.header('instanceUrl', this.connection.instanceUrl);
				return next();
			}.bind(this));
		},
		disconnect: function disconnect(next) {
			if (this.connection) {
				this.connection.logout(function logoutTask() {
					this.connection = null;
					next();
				}.bind(this));
			}
			if (this.baseConnection) {
				this.baseConnection.logout(function logoutTask() {
					this.baseConnection = null;
					next();
				}.bind(this));
			}
		},
		
		/*
		 Metadata.
		 */
		defaultConfig: defaultConfig,
		fetchConfig: function fetchConfig(next) {
			if (!this.config.requireSessionLogin) {
				this.logger.warn('config.requireSessionLogin is turned off; requests can use the global salesforce authentication.');
			}
			next(null, this.config);
		},
		fetchMetadata: function fetchMetadata(next) {
			next(null, {
				fields: [
					Arrow.Metadata.URL({
						name: 'url',
						description: 'url for connector',
						required: true,
						default: 'https://login.salesforce.com'
					}),
					Arrow.Metadata.Text({
						name: 'username',
						description: 'username for login',
						required: true
					}),
					Arrow.Metadata.Password({
						name: 'password',
						description: 'password for login',
						required: true,
						validator: /[a-z\d]{3,}/i
					}),
					Arrow.Metadata.Text({
						name: 'token',
						description: 'token for login',
						required: true,
						validator: /[a-z\d]{15,}/i
					})
				]
			});
		},
		fetchSchema: function fetchSchema(next) {
			if (this.config.enabled === false) {
				return next();
			}
			this.generateSchema(function(err,schema){
				if (err) { return next(parseError(err)); }
				this.schema = schema;
				if (schema && (this.config.generateModelsFromSchema === undefined || this.config.generateModelsFromSchema)) {
					return this.generateModels(schema, next);
				}
				return next();
			}.bind(this));
		},
		
		/*
		 CRUD.
		 */
		create: function create(Model, values, next) {
			try {
				var object = getObject(Model, getConnection(this)),
					connector = this,
					payload = Model.instance(values, false).toPayload();

				object.create(payload, function createCallback(err, result) {
					if (err) { return next(parseError(err)); }
					else { return connector.findOne(Model, result.Id || result.id, next); }
				});
			}
			catch (E) {
				return next(E);
			}
		},
		findAll: function findAll(Model, next) {
			try {
				var query = 'SELECT Id, ' + getObjectFields(Model) + ' FROM ' + getObjectName(Model) + ' LIMIT 1000';
				getConnection(this).query(query, function queryCallback(err, result) {
					if (err) { return next(parseError(err)); }

					var array = result.records.map(function recordMapper(record) {
						try {
							var result = _.omit(record, 'attributes'),
								instance = Model.instance(result, true);
							instance.setPrimaryKey(record.Id || record.id);
							return instance;
						}
						catch (e) {
							next(e);
						}
					});
					next(null, new Collection(Model, array));
				});
			}
			catch (E) {
				return next(E);
			}
		},
		findOne: function findOne(Model, id, next) {
			try {
				var object = getObject(Model, getConnection(this));
				object.retrieve(id, function retrieveCallback(err, record) {
					if (err) { return next(parseError(err)); }
					try {
						var result = _.omit(record, 'attributes'),
							instance = Model.instance(result, true);
						instance.setPrimaryKey(result.Id || result.id);
						next(null, instance);
					}
					catch (e) {
						next(e);
					}
				});
			}
			catch (E) {
				return next(E);
			}
		},
		query: function(Model, options, next) {
			try {
				if (_.isFunction(options)) {
					next = options;
					options = null;
				}
				if (!options) {
					options = { where: {} };
				}
				options.where = Model.translateKeysForPayload(options.where);
				
				var object = getObject(Model, getConnection(this)),
					connector = this,
					keys = Model.payloadKeys(),
					fields = {};
				for (var i = 0; i < keys.length; i++) {
					fields[keys[i]] = 1;
				}
				fields.Id = 1;

				if (options.unsel) {
					return next('"unsel" is not currently supported by the Salesforce connector.');
				}

				var chain = object.find(options.where, Model.translateKeysForPayload(options.sel) || fields);
				if (options.order) {
					chain = chain.sort(Model.translateKeysForPayload(options.order));
				}
				chain = chain.limit(options.limit);
				if (options.skip) {
					chain = chain.skip(options.skip);
				}

				chain.execute(function findCallback(err, records) {
					if (err) {
						return next(parseError(err));
					}
					var array = records.map(function recordMapper(record) {
						try {
							var result = _.omit(record, 'attributes'),
								instance = Model.instance(result, true);
							instance.setPrimaryKey(record.Id || record.id);
							return instance;
						}
						catch (e) {
							next(e);
						}
					});
					next(null, new Collection(Model, array));
				});
			}
			catch (E) {
				return next(E);
			}
		},
		save: function save(Model, instance, next) {
			try {
				var object = getObject(Model, getConnection(this)),
					connector = this,
					record = _.merge({ Id: instance.getPrimaryKey() }, instance.toPayload());

				object.update(record, function saveCallback(err, result) {
					if (err) { return next(parseError(err)); }
					else { return connector.findOne(Model, result.Id || result.id, next); }
				});
			}
			catch (E) {
				return next(E);
			}
		},
		'delete': function(Model, instance, next) {
			try {
				var object = getObject(Model, getConnection(this));
				object.destroy(instance.getPrimaryKey(), function destroyCallback(err, result) {
					if (err) { return next(parseError(err)); }
					next(null, instance);
				});
			}
			catch (E) {
				return next(E);
			}
		},
		deleteAll: function(Model, next) {
			try {
				var connector = this;
				connector.findAll(Model, function(err, results) {
					async.series(results.toArray().map(function(result) {
						return function(callback) {
							connector.delete(Model, result, function(err) {
								if (err) {
									console.error(err);
								}
								callback();
							});
						};
					}), next);
				});
			}
			catch (E) {
				return next(E);
			}
		},

		/*
		 APEX Methods.
		 */
		// support executing apex classes using the Apex REST feature
		apex: function(verb, path, body, next) {
			if (_.isFunction(body)) {
				next = body;
				body = null;
			}
			getConnection(this).apex[verb](path, body, next);
		},

		// support search using SOSL
		search: function(sosl, next) {
			getConnection(this).search(sosl, next);
		},

		// support identity API
		identity: function(next) {
			getConnection(this).identity(next);
		},

		// support apiUsage API
		apiUsage: function(next){
			next(null, getConnection(this).limitInfo);
		},

		// support the chatter API
		chatter: function(operation, resource, params, next){
			var args = [];
			if (_.isFunction(params)) {
				next = params;
			}
			else {
				args.push(params);
			}
			args.push(next);
			var scope = getConnection(this).chatter.resource(resource);
			var fn = scope[operation];
			fn.apply(scope, args);
		},
		
		
		/*
		 Utilities only used for this connector.
		 */

		generateModels: function generateModels(schema, next) {
			var generator = require('./generator');
			var modelDir = path.join(tmpdir, 'salesforce-models');
			if (!fs.existsSync(modelDir)) {
				fs.mkdir(modelDir);
			}
			generator.generateModels(this.name, modelDir, schema, !!this.config.modelAutogen, function(err){
				if (err) { return next && next(parseError(err)); }
				this.logger.debug('loading connector/'+this.name+' models from',modelDir);
				this.models = Arrow.loadModelsForConnector(this.name, module, modelDir);
				if (server) { server.registerModelsForConnector(this, this.models); }
				if (next) { next(null, schema); }
			}.bind(this));
		},
		generateSchema: function generateSchema(next) {
			if (this.config.schemaRefresh === false) {
				this.logger.debug('skipping generation of schema, config.schemaRefresh is false');
				return next && next();
			}

			//use a hashed filename with the connection details 
			//in case they change their account config and then re-run and will use old schema
			var confDir = tmpdir,
				hashedFilename = 'salesforce-schema-'+md5(this.config.username + this.config.token)+'.json';

			if (this.config.schemaCache === false) {
				var schemaGen = require('./schema');
				return schemaGen.generate(this.config, this.logger, this.baseConnection, confDir, hashedFilename, next);
			}
			var cachedFileName = path.join(confDir, hashedFilename),
				schemaRefresh = this.config.schemaRefresh === undefined ? 3.6e+6 : this.config.schemaRefresh;
			fs.exists(cachedFileName, function schemaExists(exists) {
				if (exists) {
					this.logger.debug('cached schema file found', cachedFileName);
					var stats = fs.statSync(cachedFileName),
						refresh = +stats.ctime + schemaRefresh;

					this.logger.debug('cached schema file',
						'last update =', moment(stats.ctime).fromNow(),
						'&& time to refresh =', moment(refresh).fromNow());


					// if we generated the file < refresh time, we can reuse it
					if (Date.now() < refresh) {
						this.logger.debug('reading the cached schema file',cachedFileName);
						return fs.readFile(cachedFileName, function readFile(err, buf) {
							if (err) { return next && next(parseError(err)); }
							return next && next(null, JSON.parse(buf.toString()));
						});
					}
					else {
						this.logger.debug('schema file is stale. reloading.');
					}
				}
				else {
					this.logger.debug('schema file not found, will generate');
				}
				var schemaGen = require('./schema');
				schemaGen.generate(this.config, this.logger, this.baseConnection, confDir, hashedFilename, next);
			}.bind(this));
			// refresh the schema on a schedule if set
			var timeout = typeof(this.config.schemaRefresh)==='number' ? Math.max(60000,this.config.schemaRefresh) : (60000 * 30);
			if (this.config.schemaRefresh) {
				setTimeout(function refreshTimer() {
					fs.unlink(cachedFileName, function fetchSchemaTimer() {
						var username = this.config.username,
							password = this.config.password + this.config.token;
						this.baseConnection.login(username, password, function reConnectLoginCallback(err, userInfo) {
							if (err) {
								this.logger.error('re-login failed');
								this.logger.error(err);
							}
							else {
								this.fetchSchema();
							}
						}.bind(this));
					}.bind(this));
				}.bind(this), timeout);
			}
		}

	});

};

function getConnection(context) {
	if (context.connection) {
		return context.connection;
	}
	if (context.config.requireSessionLogin) {
		throw new Error('Authentication is required. Please pass these headers: user, pass, and token; or accessToken.');
	}
	return context.baseConnection;
}

/**
 * return the object based on the model name or configured from metadata
 */
function getObject(model, connection) {
	var name = getObjectName(model),
		obj = connection.sobject(name);
	if (!obj) {
		throw new Error('invalid SF object named:' + name);
	}
	return obj;
}

/**
 * Returns the object name based on the model's meta object or, failing that, name property.
 * @param model
 * @returns {*|model.name}
 */
function getObjectName(model) {
	return model.getMeta('object') || model.name;
}

/**
 * return the object fields for a given table
 */
function getObjectFields(Model) {

	// we get the keys from the model. 
	// we then check for the fields in the metadata (if provided)
	// we need to exclude any keys that are not defined in the fields that will not
	// be in SF underlying object store (otherwise the query will fail). this allows
	// a model to be extended with new fields that aren't part of the SF object but can 
	// be added by the model or API 

	var keys = Model.payloadKeys(),
		fields = Model.getMeta('fields'),
		result = fields ? keys.filter(function(k){
			return fields.indexOf(k)!==-1;
		}) : keys;

	return result.join(',');
}

/**
 * Returns a properly populated jsForce constructor dictionary based on the provided config and headers.
 * @param config
 * @param headers
 * @returns {{loginUrl: *, logLevel: (*|exports.logLevel|opts.logLevel), accessToken: *, instanceUrl: *}}
 */
function getOpts(config, headers) {
	if (!headers) {
		headers = {};
	}
	return {
		loginUrl: headers.loginurl || config.url,
		logLevel: config.logLevel,
		accessToken: headers.accesstoken,
		instanceUrl: headers.instanceurl || config.instanceUrl
	};
}

function md5(value) {
	var hash = crypto.createHash('md5');
	hash.update(value);
	return hash.digest('hex');
}


function parseError(err) {
	if (!err.message) {
		return err;
	}
	var split = String(err.message).split('\n');
	for (var i = 0; i < split.length; i++) {
		split[i] = split[i].trim();
	}
	return split.join(' ').trim();
}