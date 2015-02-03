var _ = require('lodash'),
	async = require('async'),
	path = require('path'),
	fs = require('fs'),
	generateModels = require('../generator').generateModels;

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
		inquirer = appc.inquirer,
		arrow = appc.arrow;

	async.series([

		function connectConnector(cb) {
			var config = _.defaults(opts, require('../../conf/default'));
			config.schemaRefresh = 30 * 60000;
			config.schemaCache = true;
			tempConnector = new (require('../index').create(arrow))(config);
			tempConnector.connect(cb);
		},

		function fetchingSchema(cb) {
			schema = tempConnector.metadata.schema;
			cb();
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
			var cli = new arrow.CLI();
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
			generateModels(this.name, path.join(config.dir, 'models'), schema, true, cb);
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

