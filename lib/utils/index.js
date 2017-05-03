'use strict'

module.exports = {
    parseError: parseError,
    getObjectFields: getObjectFields,
    convertDataTypeToJSType: convertDataTypeToJSType
}

/**
 * return the object fields for a given table
 */
function getObjectFields(Model) {

    // we get the keys from the model. 
    // we then check for the fields in the metadata (if provided)
    // we need to exclude any keys that are not defined in the fields that will not
    // be in SF underlying object store (otherwise the query will fail). this allows
    // a model to be extended with new fields that aren't part of the SF object but can 
    // be added by the model or API 

    var keys = Model.payloadKeys(),
        fields = Model.getMeta('fields'),
        result = fields ? keys.filter(function (k) {
            return fields.indexOf(k) !== -1
        }) : keys

    return result.join(',')
}

function parseError(err) {
    if (!err.message) {
        return err
    }
    var split = String(err.message).split('\n');
    for (var i = 0; i < split.length; i++) {
        split[i] = split[i].trim()
    }
    return new Error(split.join(' ').trim())
}

function convertDataTypeToJSType(field, objectName) {
    if (field.type in {
        string: 1,
        id: 1,
        reference: 1,
        email: 1,
        textarea: 1,
        phone: 1,
        url: 1,
        picklist: 1,
        anyType: 1,
        address: 1,
        combobox: 1,
        datacategorygroupreference: 1,
        encryptedstring: 1
    }) {
        return 'string'
    }
    if (field.type in {
        location: 1,
        multipicklist: 1,
        complexvalue: 1
    }) {
        return 'object'
    }
    if (field.type in {
        date: 1,
        time: 1,
        datetime: 1
    }) {
        return 'date'
    }
    if (field.type in {
        boolean: 1
    }) {
        return 'boolean'
    }
    if (field.type in {
        int: 1,
        percent: 1,
        double: 1,
        currency: 1,
        base64: 1
    }) {
        return 'number'
    }
    console.log('Warning: Not sure how to handle column type "' + field.type + '" from column "' + field.name + '" and object "' + objectName + '"; using "String" as a default...')
    return 'string'
}