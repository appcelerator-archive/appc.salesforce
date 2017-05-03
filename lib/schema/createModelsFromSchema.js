'use strict'

const transformer = require('../utility/transformerToModelMetadata')
const createModelsFromDir = require('../connector-utils/createModelsFromDir')
const parseError = require('../connector-utils/parseError')

/**
 * Creates models from your schema (see "fetchSchema" for more information on the schema).
 */
exports.createModelsFromSchema = function (next) {
	const connector = this
	const sdkAPI = connector.sdkAPI
	const tools = connector.tools

	sdkAPI.getSalesforceData(connector.config, (err, data) => {
		if (err) {
			next(parseError(err))
		}
		tools.createModels(transformer(connector.name, data))
		next()
	})
}