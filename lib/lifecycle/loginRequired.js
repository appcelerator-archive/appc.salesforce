var jsforce = require('jsforce');

/**
 * loginRequired checks to see if the current req for this connector requires the user to login.
 */
exports.loginRequired = function loginRequired(request, next) {
	if (!request.headers || !request.headers.accesstoken) {
		return next(null, true);
	}
	else {
		var headers = request.headers || {},
			opts = this.getOpts(this.config, headers);

		try {
			this.connection = this.baseContext.connection = new jsforce.Connection(opts);
		}
		catch (err) {
			return next(err);
		}
		return next(null, false);
	}
};
