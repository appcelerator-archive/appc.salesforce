var fs = require('fs');
const parseError = require('../connector-utils/parseError')

/**
 * Creates a new Model or Collection object.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {Array<Object>/Object} [values] Attributes to set on the new model(s).
 * @param {Function} callback Callback passed an Error object (or null if successful), and the new model or collection.
 * @throws {Error}
 */
exports.create = function create(Model, values, callback) {
	try {
		var connector = this
		var modelName = this.tools.getRootModelName(Model).nameOnly
		var payload = Model.instance(values, false).toPayload()

		connector.sdkAPI.sobject.create(modelName, payload, function createCallback(err, result) {
			if (err) {
				return callback(parseError(err))
			} else {
				return connector.findOne(Model, result.Id || result.id, callback)
			}
		})
	} catch (E) {
		return callback(E)
	}
}