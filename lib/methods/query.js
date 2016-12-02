var Arrow = require('arrow'),
	_ = require('lodash');

/**
 * Queries for particular model records.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {ArrowQueryOptions} options Query options.
 * @param {Function} callback Callback passed an Error object (or null if successful) and the model records.
 * @throws {Error} Failed to parse query options.
 */
exports.query = function (Model, options, callback) {
	var self = this;
	try {
		if (_.isFunction(options)) {
			callback = options;
			options = null;
		}
		if (!options) {
			options = {where: {}};
		}
		options.where = Model.translateKeysForPayload(options.where);

		/**
		 * Convert Date filter props to SalesForce based date fields
		 */
		if (options.where) {
			Object.keys(options.where).filter(function (fieldKey) {
				return _.has(Model.fields, fieldKey) && ['date', 'time', 'datetime'].indexOf(Model.fields[fieldKey].originalType) !== -1;
			}).forEach(function (fieldKey) {
				// Nested iteration
				var convert = function convert(obj, type) {
					if (typeof(obj) === 'object') {
						Object.keys(obj).forEach(function (key) {
							obj[key] = convert(obj[key], type);
						});
						return obj;
					}
					return self.convertDateToJSFDateTime(obj, type);
				};
				// Set the converted field
				options.where[fieldKey] = convert(options.where[fieldKey], Model.fields[fieldKey].originalType);
			});
		}

		var object = this.getObject(Model, this.getConnection()),
			keys = Model.payloadKeys(),
			fields = {};
		for (var i = 0; i < keys.length; i++) {
			fields[keys[i]] = 1;
		}
		fields.Id = 1;

		if (options.unsel) {
			return callback('"unsel" is not currently supported by the Salesforce connector.');
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
				return callback(self.parseError(err));
			}

			var array = records.map(function recordMapper(record) {
				try {
					var result = _.omit(record, 'attributes'),
						instance = Model.instance(result, true);
					instance.setPrimaryKey(record.Id || record.id);
					return instance;
				}
				catch (e) {
					callback(e);
				}
			});
			callback(null, new Arrow.Collection(Model, array));
		});
	}
	catch (E) {
		return callback(E);
	}
};
