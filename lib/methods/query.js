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
	try {
		if (_.isFunction(options)) {
			callback = options;
			options = null;
		}
		if (!options) {
			options = {where: {}};
		}
		options.where = Model.translateKeysForPayload(options.where);

		var object = this.getObject(Model, this.getConnection()),
			self = this,
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
