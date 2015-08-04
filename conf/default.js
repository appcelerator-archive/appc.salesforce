module.exports = {
	logs: './logs',
	quiet: false,
	logLevel: 'info',
	apikey: '0yP9XFSbBxxQeQ2swCyjdm3LHYOahXBk',
	admin: {
		enabled: false,
		disableAutoLogin: true,
		prefix: '/arrow'
	},

	connectors: {
		'appc.salesforce': {
			// set these for your salesforce instance
			requireSessionLogin: false,
			url: 'https://test.salesforce.com',
			username: '',
			password: '',
			token: '',
			schemaRefresh: 3.6e+6 * 24, // one day
			modelAutogen: true
		}
	}
};
