var os = require('os'),
	fs = require('fs'),
	path = require('path');

/**
 * Returns a directory in to which generated models can be placed.
 */
exports.getModelDir = function getModelDir() {
	if (!this.modelDir) {
		var cacheDir = this.getCacheDir();
		this.modelDir = path.join(cacheDir, 'models');
		ensureExists(this.modelDir);
	}
	return this.modelDir;
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
