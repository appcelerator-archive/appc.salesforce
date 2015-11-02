var os = require('os'),
	fs = require('fs'),
	path = require('path');

/**
 * Returns a directory in to which generated models can be placed.
 */
exports.getCacheDir = function getCacheDir() {
	if (!this.cacheDir) {
		this.cacheDir = path.join(os.tmpdir(), this.name);
		ensureExists(this.cacheDir);
	}
	return this.cacheDir;
};

/**
 * Makes sure that the specified directory exists.
 * @param dir
 */
function ensureExists(dir) {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}
}
