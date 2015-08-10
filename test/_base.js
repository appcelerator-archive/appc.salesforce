'use strict';

var Arrow = require('arrow'),
	server = new Arrow({
		port: (Math.random() * 40000 + 1200) | 0
	}),
	connector = server.getConnector('appc.salesforce');

global.Arrow = Arrow;
global.server = server;
global.connector = connector;
