var fs = require('fs'),
	path = require('path'),
	moment = require('moment');

exports.generateSchema = function generateSchema(next) {
	if (this.config.schemaRefresh === false) {
		this.logger.debug('skipping generation of schema, config.schemaRefresh is false');
		return next && next();
	}

	//use a hashed filename with the connection details 
	//in case they change their account config and then re-run and will use old schema
	var confDir = this.tmpdir,
		hashedFilename = 'salesforce-schema-' + this.md5(this.config.username + this.config.token) + '.json';

	if (this.config.schemaCache === false) {
		var schemaGen = require('./schema');
		return schemaGen.generate(this.config, this.logger, this.baseConnection, confDir, hashedFilename, next);
	}

	var cachedFileName = path.join(confDir, hashedFilename),
		schemaRefresh = this.config.schemaRefresh === undefined ? 3.6e+6 : this.config.schemaRefresh;

	fs.exists(cachedFileName, function schemaExists(exists) {
		if (exists) {
			this.logger.debug('cached schema file found', cachedFileName);
			var stats = fs.statSync(cachedFileName),
				refresh = +stats.ctime + schemaRefresh;

			this.logger.debug('cached schema file',
				'last update =', moment(stats.ctime).fromNow(),
				'&& time to refresh =', moment(refresh).fromNow());


			// if we generated the file < refresh time, we can reuse it
			if (Date.now() < refresh) {
				this.logger.debug('reading the cached schema file', cachedFileName);
				return fs.readFile(cachedFileName, function readFile(err, buf) {
					if (err) { return next && next(this.parseError(err)); }
					return next && next(null, JSON.parse(buf.toString()));
				});
			}
			else {
				this.logger.debug('schema file is stale. reloading.');
			}
		}
		else {
			this.logger.debug('schema file not found, will generate');
		}
		var schemaGen = require('./schema');
		schemaGen.generate(this.config, this.logger, this.baseConnection, confDir, hashedFilename, next);
	}.bind(this));

	// refresh the schema on a schedule if set
	var timeout = typeof(this.config.schemaRefresh) === 'number' ? Math.max(60000, this.config.schemaRefresh) : (60000 * 30);
	if (this.config.schemaRefresh) {
		setTimeout(function refreshTimer() {
			fs.unlink(cachedFileName, function fetchSchemaTimer() {
				var username = this.config.username,
					password = this.config.password + this.config.token;
				this.baseConnection.login(username, password, function reConnectLoginCallback(err, userInfo) {
					if (err) {
						this.logger.error('re-login failed');
						this.logger.error(err);
					}
					else {
						this.fetchSchema();
					}
				}.bind(this));
			}.bind(this));
		}.bind(this), timeout);
	}
};
