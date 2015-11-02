module.exports = {
	logLevel: 'error',
	connectors: {
		'appc.salesforce.1': {
			connector: 'appc.salesforce',
			requireSessionLogin: false,
			url: 'https://test.salesforce.com/',
			username: 'your_salesforce_username',
			password: 'your_salesforce_password',
			token: 'your_salesforce_token',
			schemaRefresh: 3.6e+6 * 24, // one day
			modelAutogen: true,
			generateModelsFromSchema: true,
			generateModels: [
				'Account',
				'Contract',
				'ExceptionLog__c'
			]
		},
		'appc.salesforce.2': {
			connector: 'appc.salesforce',
			requireSessionLogin: false,
			url: 'https://test.salesforce.com/',
			username: 'your_salesforce_username',
			password: 'your_salesforce_password',
			token: 'your_salesforce_token',
			schemaRefresh: 3.6e+6 * 24, // one day
			modelAutogen: true,
			generateModelsFromSchema: true,
			generateModels: [
				'Account',
				'Contract',
				'ExceptionLog__c'
			]
		}
	}
};
