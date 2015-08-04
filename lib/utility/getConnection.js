exports.getConnection = function getConnection() {
	if (this.connection) {
		return this.connection;
	}
	if (this.config.requireSessionLogin) {
		throw new Error('Authentication is required. Please pass these headers: user, pass, and token; or accessToken.');
	}
	return this.baseConnection;
};
