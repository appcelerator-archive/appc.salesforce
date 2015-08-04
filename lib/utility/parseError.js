exports.parseError = function parseError(err) {
	if (!err.message) {
		return err;
	}
	var split = String(err.message).split('\n');
	for (var i = 0; i < split.length; i++) {
		split[i] = split[i].trim();
	}
	return new Error(split.join(' ').trim());
};
