var async = require('async');

/**
 * Disconnects from your data store.
 * @param next
 */
exports.disconnect = function (next) {
	var tasks = [],
		self = this;

	if (this.connection) {
		tasks.push(function (next) {
			self.connection.logout(function logoutTask() {
				self.connection = null;
				next();
			});
		});
	}

	if (this.baseConnection) {
		tasks.push(function (next) {
			self.baseConnection.logout(function baseLogoutTask() {
				self.baseConnection = null;
				next();
			});
		});
	}

	async.series(tasks, next);
};
