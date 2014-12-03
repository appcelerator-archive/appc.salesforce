var _ = require('lodash'),
	fs = require('fs'),
	path = require('path'),
	async = require('async');

exports.generate = generate;

function generate(config, logger, connection, confDir, fn, callback) {
	if (config._cachedSchema) {
		return callback(null, config._cachedSchema);
	}
	var schemaFn = confDir && path.join(confDir, fn),
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
						logger.debug('fetched metadata for',(count+'/'+total).yellow,sobject.name.magenta.bold);
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
				config._cachedSchema = schema;
				process.nextTick(function(){
					callback(null, schema);
				});
			}
		});
	});
}