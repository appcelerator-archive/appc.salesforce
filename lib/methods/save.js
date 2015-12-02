var _ = require('lodash');

/**
 * Updates a Model instance.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {Arrow.Instance} instance Model instance to update.
 * @param {Function} callback Callback passed an Error object (or null if successful) and the updated model.
 */
exports.save = function save(Model, instance, callback) {
	try {
		var object = this.getObject(Model, this.getConnection()),
			self = this,
			record = _.merge({Id: instance.getPrimaryKey()}, instance.toPayload());

		object.update(record, function saveCallback(err, result) {
			if (err) { return callback(self.parseError(err)); }
			else { return self.findByID(Model, result.Id || result.id, callback); }
		});
	}
	catch (E) {
		return callback(E);
	}
};
