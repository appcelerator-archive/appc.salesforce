var _ = require('lodash')

/**
 * support executing apex classes using the Apex REST feature
 * @param verb
 * @param path
 * @param body
 * @param next
 */
exports.apex = function (verb, path, body, next) {
  if (_.isFunction(body)) {
    next = body
    body = null
  }
  this.sdkAPI.apex(verb, path, body, next)
}
