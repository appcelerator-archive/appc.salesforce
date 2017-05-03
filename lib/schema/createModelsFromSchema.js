'use strict'

const transformer = require('../utils/transformer')

/**
 * Creates models from your schema (see "fetchSchema" for more information on the schema).
 */
exports.createModelsFromSchema = function (next) {
	const connector = this
	const sdkAPI = connector.sdkAPI
	const tools = connector.tools

	sdkAPI.getSalesforceData(connector.config, (err, data) => {
		if (err) {
			next(err)
		}
		tools.load.models(transformer(connector.name, data))
		next()
	})
}