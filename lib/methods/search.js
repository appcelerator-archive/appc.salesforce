/**
 * support search using SOSL
 * @param sosl
 * @param next
 */
exports.search = function (sosl, next) {
	self.sdkAPI.search(sosl, next);
};