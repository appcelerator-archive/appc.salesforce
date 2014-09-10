var APIBuilder = require('apibuilder'),
	_ = require('lodash'),
	fs = require('fs'),
	path = require('path'),
	jsforce = require('jsforce'),
	pkginfo = require('pkginfo')(module),
	pkginfo = module.exports,
	Connector = APIBuilder.Connector,
	Collection = APIBuilder.Collection,
	Instance = APIBuilder.Instance;

// --------- in memory DB connector -------

module.exports = Connector.extend({

	// generated configuration
	config: APIBuilder.Loader(),
	name: 'salesforce',
	pkginfo: _.pick(pkginfo,'name','version','description','author','license','keywords','repository'),
	logger: APIBuilder.createLogger({},{name:'salesforce',useConsole:true,level:'debug'}),

	// implementation

	constructor: function constructor() {
	},
	fetchConfig: function fetchConfig(next) {
		next(null, this.config);
	},
	fetchMetadata: function fetchMetadata(next){
		next(null, {
			fields: [
				Mobware.Metadata.URL({
					name: 'url',
					description: 'url for connector',
					required: true,
					default: 'https://login.salesforce.com'
				}),
				Mobware.Metadata.Text({
					name: 'username',
					description: 'username for login',
					required: true
				}),
				Mobware.Metadata.Password({
					name: 'password',
					description: 'password',
					required: true,
					validator: /[a-z\d]{3,}/i
				}),
				Mobware.Metadata.Text({
					name: 'token',
					description: 'token',
					required: true,
					validator: /[a-z\d]{15,}/i
				})
			]
		});
	},
	fetchSchema: function fetchSchema(next){
		var confDir = path.join(__dirname, '..','conf'),
			cachedFileName = path.join(confDir,'schema.json');
		fs.exists(cachedFileName, function schemaExists(exists){
			if (exists) {
				this.logger.debug('cached schema file found',cachedFileName);
				var stats = fs.statSync(cachedFileName),
					ago = Date.now() - stats.ctime;
				this.logger.debug('cached schema file modification date',stats.ctime,'created ago=',ago,'refresh=',this.config.schemaRefresh);
				// if we generated the file < refresh time, we can reuse it
				if (this.config.schemaRefresh && this.config.schemaRefresh >= ago) {
					return fs.readFile(cachedFileName,function readFile(err,buf){
						if (err) { return next(err); }
						return next(null, JSON.parse(buf.toString()));
					});
				}
			}
			this.logger.debug('schema file not found, will generate');
			var schemaGen = require('./schema');
			schemaGen.generate(this.config,this.logger,this.connection,confDir,next);
		}.bind(this));
		// refresh the schema on a schedule if set
		var timeout = this.config.schemaRefresh || (60000 * 30);
		if (this.config.schemaRefresh) {
			setTimeout(function refreshTimer(){
				fs.unlink(cachedFileName, function fetchSchemaTimer(){
					this.fetchSchema();
				}.bind(this));
			}.bind(this), timeout);
		}
	},
	loginRequired: function loginRequired(request, next) {
		// FIXME -- support per session login
		next(null, false);
	},
	login: function login(request, next) {
		next();
	},
	connect: function connect(next) {
		this.logger.info('connect',this.config);
		var opts = {
			loginUrl: this.config.url,
			logLevel: this.config.logLevel
		};
		this.connection = new jsforce.Connection(opts);
		var password = this.config.password + this.config.token;
		this.connection.login(this.config.username, password, function loginCallback(err, userInfo) {
			if (err) { return next(err); }
			return next();
		}.bind(this));
	},
	disconnect: function disconnect(next){
		this.logger.info('disconnect');
		if (this.connection) {
			this.connection.logout(function logoutTask(){
				this.connection = null;
				next();
			}.bind(this));
		}
	},
	findOne: function findOne(Model, id, next) {
		try {
			var object = getObject(Model, this.connection),
				connector = this;
			object.retrieve(id, function retrieveCallback(err,record){
				if (err) { return handleError(connector,err,next); }
				var result = _.omit(record,'attributes');
				var instance = Model.instance(result,true);
				instance.setPrimaryKey(result.Id);
				next(null, instance);
			});
		}
		catch (E){
			return handleError(this,E,next);
		}
	},
	findAll: function findAll(Model, next) {
		try {
			var query = 'SELECT Id, ' + Model.keys().join(',') +' FROM '+getObjectName(Model),
				connector = this;
			this.connection.query(query, function queryCallback(err,result){
				if (err) { return handleError(connector,err,next); }
				var array = result.records.map(function recordMapper(record){
					var result = _.omit(record,'attributes');
					var instance = Model.instance(result,true);
					instance.setPrimaryKey(record.Id);
					return instance;
				});
				next(null, new Collection(Model,array));
			});
		}
		catch (E){
			return handleError(this,E,next);
		}
	},
	create: function create(Model, values, next) {
		try {
			var object = getObject(Model, this.connection),
				connector = this;
			object.create(values, function createCallback(err,result){
				if (err) { return handleError(connector,err,next); }
				var instance = Model.instance(result,true);
				instance.setPrimaryKey(result.Id);
				next(null, instance);
			});
		}
		catch (E){
			return handleError(this,E,next);
		}
	},
	save: function save(Model, instance, next) {
		try {
			var object = getObject(Model, this.connection),
				connector = this,
				record = _.merge({Id:instance.getPrimaryKey()}, instance.values());
			object.update(record, function saveCallback(err,result){
				if (err) { return handleError(connector,err,next); }
				var instance = Model.instance(result,true);
				instance.setPrimaryKey(result.Id);
				next(null, instance);
			});
		}
		catch (E){
			return handleError(this,E,next);
		}
	},
	delete: function (Model, instance, next) {
		try {
			var object = getObject(Model, this.connection),
				connector = this;
			object.destroy(instance.getPrimaryKey(), function destroyCallback(err,result){
				if (err) { return handleError(connector,err,next); }
				next();
			});
		}
		catch (E){
			return handleError(this,E,next);
		}
	},
	deleteAll: function (Model, callback) {
		//TODO:
		callback(new Error("not yet implemented"));
	},
	query: function(Model, query, callback) {
	}

});

// utilities only needed for this connector

function handleError(connector, err, next) {
	if (err.errorCode === 'NOT_FOUND') {
		return connector.notFoundError(next);
	}
	return next(err);
}

/**
 * return the object based on the model name or configured from metadata
 */
function getObject(model, connection){
	var name = getObjectName(model),
		obj = connection.sobject(name);
	if (!obj) {
		throw new Error('invalid SF object named:'+name);
	}
	return obj;
}

function getObjectName(model) {
	return model.getMeta('object') || model.name;
}
