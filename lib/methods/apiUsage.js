/**
 * support apiUsage API
 * @param next
 */
exports.apiUsage = function (next) {
	next(null, this.getConnection().limitInfo);
};
