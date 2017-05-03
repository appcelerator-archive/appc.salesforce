var os = require('os'),
    fs = require('fs'),
    path = require('path');

/**
 * Returns a directory in to which generated models can be placed.
 */
module.exports = function getCacheDir(self) {
    if (!self.cacheDir) {
        self.cacheDir = path.join(os.tmpdir(), self.name);
        ensureExists(self.cacheDir);
    }
    return self.cacheDir;
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
