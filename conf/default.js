module.exports = {
	logs: './logs',
	quiet: false,
	logLevel: 'debug',
	apikey: '0yP9XFSbBxxQeQ2swCyjdm3LHYOahXBk',
	requireSessionLogin: false,
	admin: {
		enabled: true,
		prefix: '/apibuilder'
	},
	schemaRefresh: 3.6e+6, //1 hour

	// set these for your salesforce instance
	url: 'https://test.salesforce.com',
	username: '',
	password: '',
	token:''
};
