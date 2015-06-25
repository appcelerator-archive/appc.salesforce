module.exports = {
	connectors: {
		'appc.salesforce': {
			/*
			 requireSessionLogin allows you to configure whether or not anonymous requests can use your default
			 account (specified below) for connecting to Salesforce. Set this to "true" to require requests to specify
			 their own credentials or their own session token (via the headers user, pass, and token, or accessToken).
			 */
			requireSessionLogin: false,
			url: 'https://test.salesforce.com/',
			username: 'your_salesforce_username',
			password: 'your_salesforce_password',
			token: 'your_salesforce_token',
			version: '26.0' //API version needed if not latest ,
			
			generateModelsFromSchema: true // Generate models from your schema.
		}
	}
};