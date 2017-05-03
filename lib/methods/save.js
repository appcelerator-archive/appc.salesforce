var _ = require('lodash')
const utils = require('../utils')

/**
 * Updates a Model instance.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {Arrow.Instance} instance Model instance to update.
 * @param {Function} callback Callback passed an Error object (or null if successful) and the updated model.
 */
exports.save = function save(Model, instance, callback) {
	try {
		var connector = this
		var modelName = this.tools.getRootModelName(Model).nameOnly
		var record = _.merge({
			Id: instance.getPrimaryKey()
		}, instance.toPayload())

		connector.sdkAPI.sobject.update(modelName, record, function saveCallback(err, result) {
			if (err) {
				return callback(utils.parseError(err))
			} else {
				return connector.findOne(Model, result.Id || result.id, callback)
			}
		})
	} catch (E) {
		return callback(E)
	}
};