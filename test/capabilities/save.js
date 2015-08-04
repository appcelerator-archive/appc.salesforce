var should = require('should');

exports.save = {
	iterations: 1, // To run this test multiple times (useful when you're caching results), increase this number.
	insert: {
		Name: 'Dawson Toth'
	},
	update: {
		Name: 'Dawson Tooth'
	},
	check: function (result) {
		should(result.id).be.ok;
		should(result.Name).equal('Dawson Tooth');
	}
};
