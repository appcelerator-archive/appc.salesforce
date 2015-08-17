/**
 * Returns the connector's configuration.
 *
 * @param {function} next - A function to call with the connector's configuration.
 */

exports.fetchConfig = function fetchConfig(next) {
	if (!this.config.requireSessionLogin) {
		this.logger.debug('config.requireSessionLogin is turned off; requests can use the global Salesforce authentication.');
	}
	next(null, this.config);
};
