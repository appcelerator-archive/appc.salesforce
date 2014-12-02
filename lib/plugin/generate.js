var async = require('async'),
	path = require('path'),
	fs = require('fs'),
	_ = require('lodash'),
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
			message: 'What is the URL to your Salesforce instance?',
			required: true
		},
		{
			type: 'input',
			name: 'username',
			message: 'What is your username?',
			required: true
		},
		{
			type: 'password',
			name: 'password',
			message: 'What is your password?',
			required: true
		},
		{
			type: 'password',
			name: 'token',
			message: 'What is your token?',
			required: true
		}
	]
};

// opts will contain answers to all field questions
function generate(appc, opts, callback) {
	var tempConnector,
		schema,
		config,
		inquirer = appc.inquirer;

	async.series([

		function connectConnector(cb) {
			var config = _.defaults(opts, require('../../conf/default'));
			tempConnector = new (require('../index').create(apibuilder))(config);
			tempConnector.connect(cb);
		},

		function fetchingSchema(cb) {
			tempConnector.fetchSchema(function schemaFetched(err, result) {
				if (err) { cb(err); }
				else {
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
					required: true,
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
			var localConfig = {
				connectors: {}
			};
			var obj = _.pick(opts, 'url','username','password','token');
			obj.schemaRefresh = false;
			obj.requireSessionLogin = false;
			obj.connector = config.name;
			localConfig.connectors[config.name] = obj;
			var content = 'module.exports=' + JSON.stringify(localConfig, null, '\t') + ';';
			fs.writeFile(local, content, cb);
		},

		function writeGitignore(cb) {
			var fn = path.join(config.dir, 'conf', '.gitignore');
			fs.writeFile(fn, 'local.js', cb);
		},

		function writeModels(cb) {
			async.eachSeries(_.keys(schema.objects), function(objectName, done) {
				var obj = schema.objects[objectName],
					model = {
						// description: obj.label,
						name: objectName,
						fields: {},
						connector: config.name
					};

				for (var i = 0; i < obj.fields.length; i++) {
					var field = obj.fields[i];
					if (field.name === 'Id') {
						// skip built-in primary key. we handle that special in the connector
						continue;
					}
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
			if (!fs.existsSync(toDir)) {
				fs.mkdirSync(toDir);
			}
			fs.writeFile(to, toBuf, cb);
		},

		function writeOutPackageJSON(cb) {
			var fromPKG = require(path.join(__dirname, '..', '..', 'package.json')),
				to = path.join(config.dir, 'package.json'),
				toPKG = require(to),
				ignore = ['inquirer',fromPKG.name]; // these packages don't need to be copied since they are used by this plugin

			toPKG.appcelerator = {};
			toPKG.appcelerator['connector/'+fromPKG.name] = '^'+fromPKG.version;

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
