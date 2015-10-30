var jsforce = require('jsforce');

/**
 * Connects to your data store; this connection can later be used by your connector's methods.
 * @param next
 */
exports.connect = function (next) {
	var self = this,
		opts = this.getOpts(),
		username = this.config.username,
		password = this.config.password + this.config.token;

	if (!username) {
		return next(new Error('Missing required ' + this.name + ' connector configuration. Make sure you add your configuration to your config file in ./conf'));
	}

	this.baseContext = this;
	this.baseConnection = new jsforce.Connection(opts);
	this.baseConnection.login(username, password, function connectLoginCallback(err, userInfo) {
		if (err) {
			self.logger.error(err);
			return next(self.parseError(err));
		} else {
			self.logger.trace('connected');
			return next();
		}
	});
};
