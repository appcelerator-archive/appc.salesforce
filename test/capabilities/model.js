var Arrow = require('arrow');

exports.model = Arrow.Model.extend('Account', {
	fields: {
		Name: {type: String, required: false, validator: /[a-zA-Z]{3,}/},
		Type: {type: String, readonly: true}
	}
});
