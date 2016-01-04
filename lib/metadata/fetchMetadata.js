var Arrow = require('arrow');

/**
 * Fetches metadata describing your connector's proper configuration.
 * @param next
 */
exports.fetchMetadata = function fetchMetadata(next) {
	next(null, {
		fields: [
			Arrow.Metadata.URL({
				name: 'url',
				description: 'url for connector',
				required: true,
				'default': 'https://login.salesforce.com'
			}),
			Arrow.Metadata.Text({
				name: 'username',
				description: 'username for login',
				required: true
			}),
			Arrow.Metadata.Password({
				name: 'password',
				description: 'password for login',
				required: true,
				validator: /[a-z\d]{3,}/i
			}),
			Arrow.Metadata.Text({
				name: 'token',
				description: 'token for login',
				required: false,
				validator: /[a-z\d]{15,}/i
			})
		]
	});
};
