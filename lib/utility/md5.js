var crypto = require('crypto');

exports.md5 = function md5(value) {
	var hash = crypto.createHash('md5');
	hash.update(value);
	return hash.digest('hex');
};
