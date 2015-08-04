/**
 * Returns the object name based on the model's meta object or, failing that, name property.
 * @param model
 * @returns {*|model.name}
 */
exports.getObjectName = function getObjectName(model) {
	return model.getMeta('object') || model.name;
};
