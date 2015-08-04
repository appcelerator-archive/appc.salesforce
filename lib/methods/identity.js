/**
 * support identity API
 * @param next
 */
exports.identity = function (next) {
	this.getConnection().identity(next);
};
