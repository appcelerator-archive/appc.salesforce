var should = require('should');

exports.query = {
	iterations: 1, // To run this test multiple times (useful when you're caching results), increase this number.
	insert: [
		{
			Name: 'TEST: Rick Blalock'
		},
		{
			Name: 'TEST: Nolan Wright'
		}
	],
	query: {
		where: {
			Name: {
				$like: 'TEST: Nolan%'
			}
		}
	},
	check: function (results) {
		should(results.length).be.above(0);
		should(results[0].Name).be.ok;
	}
};
