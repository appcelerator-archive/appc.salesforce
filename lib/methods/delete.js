/**
 * Deletes the model instance.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {Arrow.Instance} instance Model instance.
 * @param {Function} callback Callback passed an Error object (or null if successful), and the deleted model.
 */
exports['delete'] = function (Model, instance, callback) {
	try {
		var object = this.getObject(Model, this.getConnection()),
			self = this;
		object.destroy(instance.getPrimaryKey(), function destroyCallback(err, result) {
			if (err) { return callback(self.parseError(err)); }
			callback(null, instance);
		});
	}
	catch (E) {
		return callback(E);
	}
};
