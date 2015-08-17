var fs = require('fs'),
	path = require('path');

exports.cleanGeneratedModels = function () {
	var modelDir = path.join(this.tmpdir, 'salesforce-models');
	if (!fs.existsSync(modelDir)) {
		return;
	}

	var models = fs.readdirSync(modelDir);
	for (var i = 0; i < models.length; i++) {
		var fileName = models[i];
		if (fileName.slice(-3) === '.js') {
			fs.unlinkSync(path.join(modelDir, fileName));
		}
	}
};