'use strict';

var Arrow = require('arrow'),
	server = new Arrow(),
	connector = server.getConnector('appc.salesforce');

global.Arrow = Arrow;
global.server = server;
global.connector = connector;
