const os = require('os')
const fs = require('fs')
const path = require('path')
const getCacheDir = require('./getCacheDir')
/**
 * Returns a directory in to which generated models can be placed.
 */
module.exports = function getModelDir(self) {
    if (!self.modelDir) {
        var cacheDir = getCacheDir(self)
        self.modelDir = path.join(cacheDir, 'models')
        ensureExists(self.modelDir)
    }
    return self.modelDir
};

/**
 * Makes sure that the specified directory exists.
 * @param dir
 */
function ensureExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
    }
}
