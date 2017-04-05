var _ = require('lodash'),
	fs = require('fs'),
	path = require('path'),
	async = require('async');

exports.describeGlobal = function describeGlobal(filename, callback) {
	var self = this,
		logger = this.logger,
		connection = this.baseConnection;

	if (self._cachedSchema) {
		return callback(null, self._cachedSchema);
	}

	var tasks = [],
		schema = {};

	logger.debug('generating salesforce schema');
	connection.describeGlobal(function (err, res) {
		if (err) {
			return callback(err);
		}
		schema.objects = {};
		var total = res.sobjects.length,
			count = 0;

		res.sobjects.forEach(function (sobject) {
			if (sobject.deprecatedAndHidden) {
				return total--;
			}
			if (self.config.generateModels !== undefined && self.config.generateModels.indexOf(sobject.name) === -1) {
				return total--;
			}

			tasks.push(function (next) {
				logger.debug('fetching metadata for', sobject.name);
				connection.describe(sobject.name, function (err, result) {
					if (err) {
						return next(err);
					}
					count++;
					logger.debug('fetched metadata for', (count + '/' + total), sobject.name);
					try {
						if (!result.deprecatedAndHidden && result.fields && result.fields.length) {
							var fields = result.fields.map(function (field) {
								return _.pick(field, 'name', 'label', 'length', 'nillable', 'unique',
									'updateable', 'defaultValue', 'calculated',
									'picklistValues', 'restrictedDelete', 'type',
									'inlineHelpText');
							});
							schema.objects[sobject.name] = {
								label: sobject.label,
								fields: fields
							};
						}
						process.nextTick(next);
					}
					catch (E) {
						return next(E);
					}
				});
			});
		});
		async.parallelLimit(tasks, 100, function (err) {
			if (err) {
				if (callback) {
					callback(err);
					callback = null;
				}
				return;
			}
			if (filename) {
				logger.debug('Writing schema to', filename);
				fs.writeFileSync(filename, JSON.stringify(schema, null, 2));
			}
			if (callback) {
				self._cachedSchema = schema;
				process.nextTick(function () {
					callback(null, schema);
				});
			}
		});
	});
};