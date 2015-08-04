var os = require('os');

/**
 * Creates the Salesforce Connector for Arrow.
 */
exports.create = function (Arrow) {
	var Connector = Arrow.Connector,
		Capabilities = Connector.Capabilities;

	return Connector.extend({
		filename: module.filename,
		capabilities: [
			Capabilities.ConnectsToADataSource,
			Capabilities.ValidatesConfiguration,
			//Capabilities.ContainsModels,
			Capabilities.GeneratesModels,
			Capabilities.CanCreate,
			Capabilities.CanRetrieve,
			Capabilities.CanUpdate,
			Capabilities.CanDelete,
			Capabilities.AuthenticatesThroughConnector
		],

		tmpdir: os.tmpdir()
	});
};
