var should = require('should');

exports.findAll = {
	iterations: 1, // To run this test multiple times (useful when you're caching results), increase this number.
	insert: {
		Name: 'TEST: Nolan Wright'
	},
	check: function (results) {
		should(results.length).be.above(0);
		for (var i = 0; i < results.length; i++) {
			var result = results[i];
			should(result.getPrimaryKey()).be.ok;
			should(result.Name).be.ok;
		}
	}
};
