/**
 * return the object based on the model name or configured from metadata
 */
exports.getObject = function getObject(model, connection) {
	var name = this.getObjectName(model),
		obj = connection.sobject(name);
	if (!obj) {
		throw new Error('invalid SF object named:' + name);
	}
	return obj;
};
