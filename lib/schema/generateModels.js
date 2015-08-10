var Arrow = require('arrow'),
	fs = require('fs'),
	path = require('path');

exports.generateModels = function generateModels(schema, next) {
	var generator = require('../generator'),
		self = this,
		modelDir = path.join(this.tmpdir, 'salesforce-models');

	if (!fs.existsSync(modelDir)) {
		fs.mkdir(modelDir);
	}

	generator.generateModels(this.name, modelDir, schema, !!this.config.modelAutogen, function (err) {
		if (err) {
			return next && next(self.parseError(err));
		}

		self.logger.debug('loading connector/' + self.name + ' models from', modelDir);
		self.models = Arrow.loadModelsForConnector(self.name, module, modelDir);

		if (next) {
			next();
		}
	});
};
