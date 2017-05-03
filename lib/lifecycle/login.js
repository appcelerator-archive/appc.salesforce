// const jsforce = require('jsforce')
// const utils = require('../utility/utils')
// const parseError = require('../connector-utils/parseError')

/**
 * login is called only if loginRequired calls next with the args (null, true). It looks at the current req, and
 * either logs the user in (based on credentials provided in headers) or returns an error. It can return a session
 * token via a res header so that future requests don't have to provide credentials.
 */
// exports.login = function login(request, response, next) {
// 	var self = this,
// 		headers = request.headers || {},
// 		opts = utils.getOpts(self.config, headers),
// 		username = headers.user,
// 		password = headers.pass + headers.token;

// 	if (!headers.user || !headers.pass || !headers.token) {
// 		if (this.config.requireSessionLogin) {
// 			return next(new Error('Authentication is required. Please pass these headers: user, pass, and token; or accessToken.'));
// 		} else {
// 			return next();
// 		}
// 	}

// 	this.connection = this.baseContext.connection = require('../utility/sdkFacade')(opts)
// 	this.connection.login(username, password, function loginCallback(err, userInfo) {
// 		if (err) {
// 			self.connection = self.baseContext.connection = null;
// 			return next(parseError(err));
// 		}

// 		response.header('accessToken', self.connection.accessToken);
// 		response.header('instanceUrl', self.connection.instanceUrl);
// 		return next();
// 	});
// };