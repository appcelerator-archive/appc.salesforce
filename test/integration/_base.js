'use strict';

var Arrow = require('arrow'),
	server = new Arrow({
		port: (Math.random() * 40000 + 1200) | 0
	}),
	connector = server.getConnector('appc.salesforce.1');

before(function (next) {
	server.start(next);
});

global.Arrow = Arrow;
global.server = server;
global.connector = connector;