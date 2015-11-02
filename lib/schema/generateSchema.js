var fs = require('fs'),
	path = require('path'),
	moment = require('moment');

exports.generateSchema = function generateSchema(next) {
	var self = this;
	if (self.config.schemaRefresh === false) {
		self.logger.debug('skipping generation of schema, config.schemaRefresh is false');
		return next && next();
	}

	/*
	 Use a hashed filename based on the configured authentication so if
	 they change their config, we will update the schema too.
	 */
	var confDir = self.getCacheDir(),
		hashedFilename = 'salesforce-schema-' + self.md5((self.config.generateModels || []).join('.') + self.config.username + self.config.token) + '.json';

	// If schemaCache is false, we look it up every time.
	if (self.config.schemaCache === false) {
		self.cleanGeneratedModels();
		return self.describeGlobal(confDir, hashedFilename, next);
	}

	var cachedFileName = path.join(confDir, hashedFilename),
		schemaRefresh = self.config.schemaRefresh === undefined ? 3.6e+6 : self.config.schemaRefresh;

	fs.exists(cachedFileName, function schemaExists(exists) {
		if (!exists) {
			self.logger.debug('schema file not found, will generate');
			self._cachedSchema = null;
			self.cleanGeneratedModels();
			self.describeGlobal(confDir, hashedFilename, next);
		}
		else {
			checkCachedVersion();
		}
	});

	/**
	 * Checks if the cached schema can be used without talking to the server at all.
	 */
	function checkCachedVersion() {
		self.logger.debug('cached schema file found', cachedFileName);
		var stats = fs.statSync(cachedFileName),
			refresh = +stats.mtime + schemaRefresh;

		self.logger.debug('cached schema file',
			'last update =', moment(stats.mtime).fromNow(),
			'&& time to refresh =', moment(refresh).fromNow());

		// if we modified the file < refresh time, we can reuse it
		if (Date.now() < refresh) {
			useCachedVersion();
		}
		else {
			lookForUpdates(stats);
		}
	}

	/**
	 * Checks if the server has newer information than what we have in our cached schema.
	 */
	function lookForUpdates(stats) {
		self.logger.debug('checking for updates to the cached schema file');
		self.baseConnection.request({
				method: 'GET',
				url: '/sobjects',
				headers: {
					'If-Modified-Since': moment(stats.mtime).format('ddd, DD MMM YYYY HH:mm:ss z')
				}
			},
			function (err, res) {
				if (err) {
					self.logger.error('checking for updates failed');
					self.logger.error(err);
					return;
				}

				if (res === '') {
					self.logger.debug('the schema is up to date');
					var timestamp = new Date();
					fs.utimesSync(cachedFileName, timestamp, timestamp);
					useCachedVersion();
				}
				else {
					self.logger.debug('schema file updates are available, regenerating');
					// TODO: Don't throw out the whole schema file, just update the changed objects...
					self._cachedSchema = null;
					self.cleanGeneratedModels();
					self.describeGlobal(confDir, hashedFilename, next);
				}
			});
	}

	function useCachedVersion() {
		self.logger.debug('reading the cached schema file', cachedFileName);
		fs.readFile(cachedFileName, 'UTF-8', function readFile(err, contents) {
			if (!next) {
				return;
			}
			if (err) {
				next(self.parseError(err));
			}
			else {
				next(null, JSON.parse(contents));
			}
		});

	}

	// refresh the schema on a schedule (if schemaRefresh is set)
	if (self.config.schemaRefresh) {
		setTimeout(function refreshTimer() {
			var username = self.config.username,
				password = self.config.password + self.config.token;
			self.baseConnection.login(username, password, function reConnectLoginCallback(err, userInfo) {
				if (err) {
					self.logger.error('re-login failed');
					self.logger.error(err);
				}
				else {
					self.fetchSchema();
				}
			});
		}, typeof(self.config.schemaRefresh) === 'number' ? Math.max(60000, self.config.schemaRefresh) : (60000 * 30));
	}
};
