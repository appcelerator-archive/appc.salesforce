var should = require('should');

exports.save = {
	iterations: 1, // To run this test multiple times (useful when you're caching results), increase this number.
	insert: {
		Name: 'TEST: Dawson Toth'
	},
	update: {
		Name: 'TEST: Dawson Tooth'
	},
	check: function (result) {
		should(result.id).be.ok;
		should(result.Name).equal('TEST: Dawson Tooth');
	}
};
