/**
 * Fetches the schema for your connector.
 *
 * For example, your schema could look something like this:
 * {
 *     objects: {
 *         person: {
 *             first_name: {
 *                 type: 'string',
 *                 required: true
 *             },
 *             last_name: {
 *                 type: 'string',
 *                 required: false
 *             },
 *             age: {
 *                 type: 'number',
 *                 required: false
 *             }
 *         }
 *     }
 * }
 *
 * @param next
 * @returns {*}
 */
exports.fetchSchema = function fetchSchema(next) {
	var self = this;
	this.generateSchema(function (err, schema) {
		if (!next) {
			return;
		}
		if (err) {
			next(self.parseError(err));
		}
		else {
			next(null, schema);
		}
	});
};
