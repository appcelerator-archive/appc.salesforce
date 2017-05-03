var Arrow = require('arrow'),
	_ = require('lodash');
const utils = require('../utils')

/**
 * Finds all model instances.  A maximum of 1000 models are returned.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {Function} callback Callback passed an Error object (or null if successful) and the models.
 */
exports.findAll = function findAll(Model, callback) {
	try {
		var connector = this
		var modelName = connector.tools.getRootModelName(Model).nameOnly
		var objectFields = utils.getObjectFields(Model)
		var query = `SELECT Id, ${objectFields} FROM ${modelName} LIMIT 1000`

		connector.sdkAPI.query(query, (err, result) => {
			if (err) {
				return callback(utils.parseError(err));
			}

			var array = result.records.map(function recordMapper(record) {
				try {
					var result = _.omit(record, 'attributes'),
						instance = Model.instance(result, true);
					instance.setPrimaryKey(record.Id || record.id);
					return instance;
				} catch (e) {
					callback(e);
				}
			});
			callback(null, new Arrow.Collection(Model, array));
		});
	} catch (E) {
		return callback(E);
	}
};