// 'use strict'

// const utils = require('../utility/utils')

/**
 * loginRequired checks to see if the current req for this connector requires the user to login.
 */
// exports.loginRequired = function loginRequired(request, next) {
// 	var self = this

// 	if (!request.headers || !request.headers.accesstoken) {
// 		return next(null, true);
// 	} else {
// 		var headers = request.headers || {},
// 			opts = utils.getOpts(self.config, headers);

// 		try {
// 			this.connection = this.baseContext.connection = require('../utility/sdkFacade')(opts)
// 		} catch (err) {
// 			return next(err);
// 		}
// 		return next(null, false);
// 	}
// };