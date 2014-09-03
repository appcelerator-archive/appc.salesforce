#!/usr/bin/env node

var Mobware = require('mobware2'),
		_ = require('lodash'),
		fs = require('fs'),
		path = require('path'),
		async = require('async'),
		jsforce = require('jsforce');
		config = Mobware.Loader(),
		confDir = path.join(__dirname,'..','conf'),
		metadataFn = path.join(confDir, 'metadata.json');

function fail(msg) {
	console.error(msg);
	process.exit(1);
}

var opts = _.pick(config, 'loginUrl','logLevel');
var connection = new jsforce.Connection(opts);
var password = config.password + config.token;
var tasks = [];
var schema = {};
var total = 0;
var count = 0;

console.log('Connecting to salesforce with',config.username);
connection.login(config.username, password, function(err){
			if (err) return fail(err);
			connection.describeGlobal(function(err, res) {
				if (err) return fail(err);
				schema.objects = {};
				res.sobjects.forEach(function(sobject){
						if (!sobject.deprecatedAndHidden) {
							total = Object.keys(res.sobjects).length;
							if (total > 3) return ;
							tasks.push(function(next){
								console.log('fetching metadata for',sobject.name);
								connection.describe(sobject.name, function(err,result){
									if (err) return next(err);
									count++;
									console.log('fetched metadata for',sobject.name,count+'/'+total);
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
										next();
									}
									catch (E) {
										return next(E);
									}
								});
							});
						}
				});
				console.log('SF Objects=>',Object.keys(schema.objects));
				async.parallel(tasks,function(err){
					if (err) return fail(err);
					console.log('Writing metadata to',metadataFn);
					fs.writeFileSync(metadataFn, JSON.stringify(schema,null,2));
					console.log('Done!');
				});
			});
});

