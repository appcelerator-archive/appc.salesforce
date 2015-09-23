var os = require('os'),
	semver = require('semver');

/**
 * Creates the Salesforce Connector for Arrow.
 */
exports.create = function (Arrow) {
	if (semver.lt(Arrow.Version || '0.0.1', '1.2.53')) {
		throw new Error('This connector requires a greater version of Arrow; please run `appc use latest`.');
	}
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
