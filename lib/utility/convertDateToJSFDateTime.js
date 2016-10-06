var jsforce = require('jsforce');

/**
 * Convert Date filter props to SalesForce based date fields
 * @param {field} value
 * @param {fieldType} salesforce type value
 * @returns object
 */
exports.convertDateToJSFDateTime = function convertDateToJSFDateTime(field, fieldType) {
	return fieldType === 'date' ? jsforce.Date.toDateLiteral(field) : jsforce.Date.toDateTimeLiteral(field);
};
