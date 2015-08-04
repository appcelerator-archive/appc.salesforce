/**
 * Returns a properly populated jsForce constructor dictionary based on the provided config and headers.
 * @param config
 * @param headers
 * @returns {{loginUrl: *, logLevel: (*|exports.logLevel|opts.logLevel), accessToken: *, instanceUrl: *}}
 */
exports.getOpts = function getOpts(config, headers) {
	if (!headers) {
		headers = {};
	}
	return {
		loginUrl: headers.loginurl || config.url,
		logLevel: config.logLevel,
		accessToken: headers.accesstoken,
		instanceUrl: headers.instanceurl || config.instanceUrl
	};
};
