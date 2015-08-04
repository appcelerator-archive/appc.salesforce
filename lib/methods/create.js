var fs = require('fs');

/**
 * Creates a new Model or Collection object.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {Array<Object>/Object} [values] Attributes to set on the new model(s).
 * @param {Function} callback Callback passed an Error object (or null if successful), and the new model or collection.
 * @throws {Error}
 */
exports.create = function create(Model, values, callback) {
	try {
		var object = this.getObject(Model, this.getConnection()),
			self = this,
			payload = Model.instance(values, false).toPayload();

		object.create(payload, function createCallback(err, result) {
			if (err) {
				return callback(self.parseError(err));
			}
			else {
				return self.findOne(Model, result.Id || result.id, callback);
			}
		});
	}
	catch (E) {
		return callback(E);
	}
};
