'use strict'

const Arrow = require('arrow')
const utils = require('../utility/utils')
const parseError = require('../connector-utils/parseError')
const sdkFacade = require('../utility/sdkFacade')
/**
 * Connects to your data store; this connection can later be used by your connector's methods.
 * @param next
 */
exports.connect = function (next) {
	const connector = this
	connector.tools = require('appc-connector-utils')(Arrow, connector)
	sdkFacade(connector.config, (err, sdkAPI) => {
		if (err) {
			next(parseError(err))
		} else {
			connector.sdkAPI = sdkAPI
			next()
		}
	})
}