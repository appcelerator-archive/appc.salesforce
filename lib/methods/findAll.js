const Arrow = require('arrow')
const _ = require('lodash')
const utils = require('../utils')

/**
 * Finds all model instances.  A maximum of 1000 models are returned.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {Function} callback Callback passed an Error object (or null if successful) and the models.
 */
exports.findAll = function findAll (Model, callback) {
  try {
    const connector = this
    const modelName = connector.tools.getRootModelName(Model).nameOnly
    const objectFields = utils.getObjectFields(Model)
    const query = `SELECT Id, ${objectFields} FROM ${modelName} LIMIT 1000`

    connector.sdkAPI.query(query, (err, results) => {
      if (err) {
        return callback(utils.parseError(err))
      }

      var array = results.records.map(function recordMapper (record) {
        const result = _.omit(record, 'attributes')
        const instance = Model.instance(result, true)
        instance.setPrimaryKey(record.Id || record.id)
        return instance
      })
      callback(null, new Arrow.Collection(Model, array))
    })
  } catch (E) {
    return callback(E)
  }
}
