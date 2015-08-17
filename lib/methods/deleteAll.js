var async = require('async');

/**
 * Deletes all the data records.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {Function} callback Callback passed an Error object (or null if successful), and the deleted models.
 */
exports.deleteAll = function (Model, callback) {
	try {
		var connector = this;
		connector.findAll(Model, function (err, results) {
			var arr = results.toArray();
			async.eachLimit(arr, 10, function deleteOneItem(item, callback) {
				connector.delete(Model, item, callback);
			}, function deleteAllResult(err) {
				if (err) {
					return callback(err);
				}
				if (arr) {
					return callback(null, arr.length);
				}
				return callback();
			});
		});
	}
	catch (E) {
		return callback(E);
	}
};
