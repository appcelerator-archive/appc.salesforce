/**
 * Disconnects from your data store.
 * @param next
 */
exports.disconnect = function (next) {
	const connector = this
	connector.sdkAPI.logout(() => {
		connector.sdkAPI = null;
		next();
	});
};