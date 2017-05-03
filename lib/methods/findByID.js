'use strict'

const _ = require('lodash');
const parseError = require('../connector-utils/parseError')

/**
 * Finds a model instance using the primary key.
 * @param {Arrow.Model} Model The model class being updated.
 * @param {String} id ID of the model to find.
 * @param {Function} callback Callback passed an Error object (or null if successful) and the found model.
 */
exports.findByID = function findByID(Model, id, callback) {
    try {
        var modelName = this.tools.getRootModelName(Model).nameOnly

        this.sdkAPI.sobject.findByID(modelName, id, (err, record) => {
            if (err) {
                if (err.errorCode === 'NOT_FOUND') {
                    return callback()
                }

                return callback(parseError(err))
            }
            try {
                var result = _.omit(record, 'attributes'),
                    instance = Model.instance(result, true)
                instance.setPrimaryKey(result.Id || result.id)
                callback(null, instance)
            } catch (e) {
                callback(e)
            }
        })
    } catch (E) {
        return callback(E)
    }
}