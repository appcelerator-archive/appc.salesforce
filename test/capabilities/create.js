var should = require('should');

exports.create = {
	iterations: 1, // To run this test multiple times (useful when you're caching results), increase this number.
	insert: {
		Name: 'Nolan Wright'
	},
	check: function (result) {
		should(result.getPrimaryKey()).be.ok;
		should(result.Name).be.ok;
	}
};
