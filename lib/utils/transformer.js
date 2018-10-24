'use strict'

const _ = require('lodash')
const utils = require('./index')

module.exports = (connectorName, sObjectMetadata) => {
  _.zipObject(_.map(sObjectMetadata, function (currentObject, key) {
    var modelInfo = {
      name: currentObject.name,
      fields: generateFields(key, currentObject.fields),
      metadata: {}
    }

    modelInfo.metadata[connectorName] = {
      object: currentObject.name,
      fields: getNamesOfFields(currentObject.fields)
    }

    sObjectMetadata[key] = modelInfo
  }))
  return sObjectMetadata
}

function generateFields (objectName, fields) {
  var transformedFields = {}

  for (var i = 0; i < fields.length; i++) {
    var field = fields[i]
    if (field.name === 'Id') {
            // skip built-in primary key. we handle that special in the connector
      continue
    }
    var newField = fields[field.name] = {
      name: field.name,
      type: utils.convertDataTypeToJSType(field, objectName),
      originalType: field.type,
      description: field.label,
      readonly: !field.updateable,
            // readonly: !!field.calculated || typeof field.updateable === 'undefined' || field.updateable === false,
      maxlength: field.length || undefined
    }
    if (field.defaultValue) {
      newField.default = field.defaultValue
    }
    if ((!field.nillable && !field.defaultValue) && newField.readonly === false) {
      newField.required = true
    }

    transformedFields[field.name] = newField
  }

  return transformedFields
}

function getNamesOfFields (fields) {
  var nameFields = fields.filter((field) => {
    if (field.name === 'Id') {
      return false
    }
    return true
  }).map((field) => {
    return field.name
  })

  return nameFields
}
