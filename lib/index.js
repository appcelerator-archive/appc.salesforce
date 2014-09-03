var Mobware = require('mobware2'),
		_ = require('lodash'),
		fs = require('fs'),
		path = require('path'),
		jsforce = require('jsforce'),
		pkginfo = require('pkginfo')(module),
		pkginfo = module.exports;

exports = module.exports = Connector;

// --------- SFDC connector -------

function Connector(config) {
	return Mobware.createConnector(config,{

		// pull in metadata from our package.json for this connector
		pkginfo: _.pick(pkginfo,'name','version','description','author','license','keywords','repository'),

		name: 'salesforce',

		// implementation methods

		fetchConfig: function(next) {
			next(null, this.config);
		},
		fetchMetadata: function(next){
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
					Mobware.Metadata.Password({
						name: 'password',
						description: 'token',
						required: true,
						validator: /[a-z\d]{15,}/i
					})
				]
			});
		},
		fetchSchema: function(next){
			var schema = JSON.parse(fs.readFileSync(path.join(__dirname, '..','conf','metadata.json')));
			next(null, schema);
		},
		connect: function(next) {
			this.logger.info('connect',this.config);
			var opts = {
				loginUrl: this.config.url,
				logLevel: this.config.logLevel
			};
			this.connection = new jsforce.Connection(opts);
			var password = this.config.password + this.config.token;
			this.connection.login(this.config.username, password, function(err, userInfo) {
				if (err) return next(err);
				console.log('userInfo',userInfo);
				return next();
			}.bind(this));
		},
		disconnect: function(next){
			this.logger.info('disconnect');
			if (this.connection) {
				this.connection.logout(function(){
					this.connection = null;
					next();
				}.bind(this));
			}
		},
		readOne: function(model, id, next) {
			try {
				var object = getObject(model, this.connection),
						connector = this;
				object.retrieve(id, function(err,record){
					if (err) return handleError(connector,err,next);
					model.set(_.omit(record,'attributes'));
					next(null,model);
				});
			}
			catch (E){
				return handleError(this,E,next)
			}
		},
		readAll: function(model, next){
			try {
				var query = 'SELECT ' + model.keys().join(',') +' FROM '+getObjectName(model),
						connector = this;
				this.connection.query(query, function(err,result){
					if (err) return handleError(connector,err,next);
					var collection = result.records.map(function(record){
						return model.new(_.omit(record,'attributes'));
					});
					next(null, collection);
				});
			}
			catch (E){
				return handleError(this,E,next)
			}
		},
		create: function(model, next){
			try {
				var object = getObject(model, this.connection),
						values = model.valuesForSaving(true),
						connector = this;
				object.create(values, function(err,result){
					if (err) return handleError(connector,err,next);
					var pk = model.getPrimaryKey();
					model.set(pk, result.id);
					next(null, model);
				});
			}
			catch (E){
				return handleError(this,E,next);
			}
		},
		update: function(model, next){
			try {
				var object = getObject(model, this.connection),
						values = model.valuesForSaving(true),
						connector = this;
				object.update(values, function(err,result){
					if (err) return handleError(connector,err,next);
					next(null, model);
				});
			}
			catch (E){
				return handleError(this,E,next);
			}
		},
		delete: function(model, id, next) {
			try {
				var object = getObject(model, this.connection),
						connector = this;
				object.destroy(id, function(err,result){
					if (err) return handleError(connector,err,next);
					next();
				});
			}
			catch (E){
				return handleError(this,E,next);
			}
		}
	});
}

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
	return model.getMetadata('object') || model.name;
}
