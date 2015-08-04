/**
 * return the object fields for a given table
 */
exports.getObjectFields = function getObjectFields(Model) {

	// we get the keys from the model. 
	// we then check for the fields in the metadata (if provided)
	// we need to exclude any keys that are not defined in the fields that will not
	// be in SF underlying object store (otherwise the query will fail). this allows
	// a model to be extended with new fields that aren't part of the SF object but can 
	// be added by the model or API 

	var keys = Model.payloadKeys(),
		fields = Model.getMeta('fields'),
		result = fields ? keys.filter(function (k) {
			return fields.indexOf(k) !== -1;
		}) : keys;

	return result.join(',');
};
