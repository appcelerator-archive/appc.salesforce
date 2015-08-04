var Arrow = require('arrow'),
	_ = require('lodash');

/**
 * Finds all model instances.  A maximum of 1000 models are returned.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {Function} callback Callback passed an Error object (or null if successful) and the models.
 */
exports.findAll = function findAll(Model, callback) {
	try {
		var query = 'SELECT Id, ' + this.getObjectFields(Model) + ' FROM ' + this.getObjectName(Model) + ' LIMIT 1000',
			self = this;
		this.getConnection().query(query, function queryCallback(err, result) {
			if (err) { return callback(self.parseError(err)); }

			var array = result.records.map(function recordMapper(record) {
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
