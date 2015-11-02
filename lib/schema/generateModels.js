var Arrow = require('arrow'),
	fs = require('fs'),
	path = require('path');

exports.generateModels = function generateModels(schema, next) {
	var generator = require('../generator'),
		self = this,
		modelDir = this.getModelDir();

	// Set models to an empty object, in case we get an error, so versions of Arrow<1.4.9 don't choke.
	self.models = {};

	generator.generateModels(self.name, modelDir, schema, !!this.config.modelAutogen, function (err) {
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
