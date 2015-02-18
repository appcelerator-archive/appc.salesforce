/**
 * NOTE: This file is simply for testing this connector and will not
 * be used or packaged with the actual connector when published.
 */
var Arrow = require('arrow'),
	server = new Arrow(),
	connector = server.getConnector('appc.salesforce');

var Account = Arrow.Model.extend('Account', {
	fields: {
		Name: { type: String, required: false, validator: /[a-zA-Z]{3,}/ },
		Type: { type: String, readonly: true },
		AccountSource: { type: String }
	},
	connector: 'appc.salesforce'
});
server.addModel(Account);

server.start(function(err) {
	if (err) {
		return server.logger.fatal(err);
	}
	server.logger.info('server started on port', server.port);

	connector.fetchSchema(function(err, schema) {
		server.logger.info('server fetched schema');
		err && server.logger.error(err);
	});
});