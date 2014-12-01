var appc = require('appcelerator'),
	_ = appc.lodash,
	async = require('async'),
	path = require('path'),
	fs = require('fs'),
	inquirer = appc.inquirer,
	apibuilder = require('apibuilder');

var TYPE = require('../../appc').TYPE;

module.exports = {
	name: 'Salesforce',
	type: TYPE,
	generator: true,
	execute: generate,

	// fields are inquirer.js "questions". There's a bit more
	// functionality, but it's not mandatory. I'll doc soon.
	fields: [
		{
			type: 'input',
			name: 'url',
			message: 'What is the URL to your Salesforce instance?'
		},
		{
			type: 'input',
			name: 'username',
			message: 'What is your username?'
		},
		{
			type: 'password',
			name: 'password',
			message: 'What is your password?'
		},
		{
			type: 'password',
			name: 'token',
			message: 'What is your token?'
		}
	]
};

// opts will contain answers to all field questions
function generate(opts, callback) {
	var tempConnector,
		schema,
		config;

	async.series([

		function connectConnector(cb) {
			tempConnector = new (require('../index').create(apibuilder))(_.defaults(opts, require('../../conf/default')));
			tempConnector.connect(cb);
		},

		function fetchingSchema(cb) {
			tempConnector.fetchSchema(function schemaFetched(err, result) {
				if (err) { cb(err); }
				else {
					console.log('fetched');
					schema = result;
					cb();
				}
			});
		},

		function pickSchemas(cb) {
			var prompts = [
				{
					type: 'checkbox',
					name: 'objectNames',
					message: 'Which objects should we use?',
					choices: _.keys(schema.objects).map(function(objectName) {
						return { name: objectName, value: objectName, checked: true };
					})
				}
			];
			inquirer.prompt(prompts, function(answers) {
				schema.objects = _.pick(schema.objects, answers.objectNames);
				cb();
			});
		},

		function generateGenericConnector(cb) {
			var cli = new apibuilder.CLI();
			cli.runCommand('new', ['connector'], function(err, results) {
				if (err) { return cb(err); }
				config = results;
				cb();
			});
		},

		function writeOutConfiguration(cb) {
			var local = path.join(config.dir, 'conf', 'local.js');
			var localConfig = opts;
			localConfig.schemaRefresh = false;
			var content = 'module.exports=' + JSON.stringify(localConfig, null, '\t') + ';';
			fs.writeFile(local, content, cb);
		},

		function writeModels(cb) {
			async.eachSeries(_.keys(schema.objects), function(objectName, done) {
				var obj = schema.objects[objectName],
					model = {
						// description: obj.label,
						name: objectName,
						fields: {},
						connector: 'appc.salesforce'
					};

				for (var i = 0; i < obj.fields.length; i++) {
					var field = obj.fields[i];
					var newField = model.fields[field.name] = {
						name: field.name,
						type: translateFieldToType(field),
						description: field.label,
						readonly: !!field.calculated,
						maxlength: field.length || undefined
					};
					if (field.defaultValue) {
						newField.default = field.defaultValue;
					}
					if (!field.nillable && !field.defaultValue) {
						newField.required = true;
					}
				}

				var buffer = "var APIBuilder = require('apibuilder');\n\n";
				buffer += "var Model = APIBuilder.Model.extend('" + objectName + "'," + JSON.stringify(model, null, '\t') + ");\n\n";
				buffer += "module.exports = Model;\n";

				fs.writeFile(path.join(config.dir, 'models', objectName.toLowerCase() + '.js'), buffer, done);
			}, cb);
		},

		function writeOutIndexJS(cb) {
			var from = path.join(__dirname, 'index.tjs'),
				to = path.join(config.dir, 'lib', 'index.js'),
				fromBuf = fs.readFileSync(from).toString(),
				toBuf = _.template(fromBuf, config);
			fs.writeFile(to, toBuf, cb);
		},

		function copyConnectorTest(cb) {
			var from = path.join(__dirname, 'connector.tjs'),
				toDir = path.join(config.dir, 'test'),
				to = path.join(toDir, 'connector.js'),
				fromBuf = fs.readFileSync(from, 'utf8'),
				toBuf = _.template(fromBuf, config);
			fs.existsSync(toDir) || fs.mkdirSync(toDir);
			fs.writeFile(to, toBuf, cb);
		},

		function writeOutPackageJSON(cb) {
			var fromPKG = require(path.join(__dirname, '..', '..', 'package.json')),
				to = path.join(config.dir, 'package.json'),
				toPKG = require(to),
				ignore = ['inquirer']; // these packages don't need to be copied since they are used by this plugin

			// TODO: Once this module is published, we can use "'^' + fromPKG.version" instead.
			toPKG.dependencies[fromPKG.name] = 'git+ssh://' + fromPKG.repository.url;

			Object.keys(fromPKG.dependencies).forEach(function(name) {
				if (!(name in toPKG.dependencies) && ignore.indexOf(name) === -1) {
					toPKG.dependencies[name] = fromPKG.dependencies[name];
				}
			});

			fs.writeFile(to, JSON.stringify(toPKG, null, '\t'), cb);
		}

	], callback);

}

function translateFieldToType(field) {
	if (field.type in {
			string: 1, id: 1, reference: 1, email: 1, textarea: 1, phone: 1, url: 1, picklist: 1, anyType: 1,
			address: 1, combobox: 1, datacategorygroupreference: 1, encryptedstring: 1
		}) {
		return 'string';
	}
	if (field.type in { location: 1, multipicklist: 1 }) {
		return 'object';
	}
	if (field.type in { date: 1, time: 1, datetime: 1 }) {
		return 'date';
	}
	if (field.type in { boolean: 1 }) {
		return 'boolean';
	}
	if (field.type in { int: 1, percent: 1, double: 1, currency: 1, base64: 1 }) {
		return 'number';
	}
	console.error('Not sure how to handle type: "' + field.type + '"; using "String" as a default...');
	return 'string';
}
