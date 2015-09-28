/**
 * Returns a properly populated jsForce constructor dictionary based on the connector's config and provided headers.
 * @param headers
 * @returns {{loginUrl: *, logLevel: (*|exports.logLevel|opts.logLevel), accessToken: *, instanceUrl: *}}
 */
exports.getOpts = function getOpts(headers) {
	if (!headers) {
		headers = {};
	}
	return {
		loginUrl: headers.loginurl || this.config.url,
		logLevel: this.config.logLevel,
		accessToken: headers.accesstoken,
		instanceUrl: headers.instanceurl || this.config.instanceUrl,
		version: this.config.version
	};
};
