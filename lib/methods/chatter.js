var _ = require('lodash');

/**
 * support the chatter API
 * @param operation
 * @param resource
 * @param params
 * @param next
 */
exports.chatter = function (operation, resource, params, next) {
	var args = [];
	if (_.isFunction(params)) {
		next = params;
	}
	else {
		args.push(params);
	}
	args.push(next);
	var scope = this.getConnection().chatter.resource(resource);
	var fn = scope[operation];
	fn.apply(scope, args);
};
