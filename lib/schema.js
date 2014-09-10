#!/usr/bin/env node

var Mobware = require('mobware2'),
	_ = require('lodash'),
	fs = require('fs'),
	path = require('path'),
	async = require('async'),
	jsforce = require('jsforce');

exports.generate = generate;

function generate(config, logger, connection, confDir, callback) {
	var schemaFn = confDir && path.join(confDir, 'schema.json'),
		opts = _.pick(config, 'loginUrl', 'logLevel'),
		tasks = [],
		schema = {};

	logger.debug("generating salesforce schema");
	connection.describeGlobal(function(err, res) {
		if (err) return callback(err);
		schema.objects = {};
		var total = res.sobjects.length,
			count = 0;
		res.sobjects.forEach(function(sobject){
			if (!sobject.deprecatedAndHidden) {
				tasks.push(function(next){
					logger.debug('fetching metadata for',sobject.name.magenta.bold);
					connection.describe(sobject.name, function(err,result){
						if (err) return next(err);
						count++;
						logger.debug('fetched metadata for',sobject.name.magenta.bold,(count+'/'+total).yellow);
						try {
							if (!result.deprecatedAndHidden && result.fields && result.fields.length) {
								var fields = result.fields.map(function(field){
									return _.pick(field,'name','label','length','nillable','unique',
											'updateable','defaultValue','calculated',
											'picklistValues','restrictedDelete','type',
											'inlineHelpText');
								});
								var obj = {
									label: sobject.label,
									fields: fields
								};
								schema.objects[sobject.name] = obj;
							}
							// don't hit the API server too fast to get rate limited
							//setTimeout(next, Math.round(Math.random()*1000));
							process.nextTick(next);
						}
						catch (E) {
							return next(E);
						}
					});
				});
			}
			else {
				total--;
			}
		});
		async.parallel(tasks,function(err){
			if (err) {
				if (callback) {
					callback(err);
					callback = null;
				}
				return;
			}
			if (schemaFn) {
				logger.debug('Writing schema to',schemaFn);
				fs.writeFileSync(schemaFn, JSON.stringify(schema,null,2));
			}
			if (callback) {
				process.nextTick(function(){
					callback(null, schema);
				});
			}
		});
	});
}

if (module.id === ".") {
	var confDir = path.join(__dirname, "..", "conf"),
		config = Mobware.Loader(),
		opts = {loginUrl: config.url, logLevel: config.logLevel},
		connection = new jsforce.Connection(opts),
		password = config.password + config.token,
		logger = Mobware.createLogger(config,{name:'sfdc'});
	connection.login(config.username, password, function(err, userInfo) {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		generate(config, logger, connection, confDir);
	});
}
