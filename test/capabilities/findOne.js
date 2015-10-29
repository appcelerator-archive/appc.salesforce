var should = require('should');

exports.findOne = {
	iterations: 1, // To run this test multiple times (useful when you're caching results), increase this number.
	insert: {
		Name: 'TEST: Nolan Wright'
	},
	check: function (result) {
		should(result.id).be.ok;
		should(result.Name).equal('TEST: Nolan Wright');
	}
};
