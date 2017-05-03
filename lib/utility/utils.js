'use strict'

var jsforce = require('jsforce')

module.exports = {
    //getOpts: getOpts,
    getObjectFields: getObjectFields,
    convertDataTypeToJSType: convertDataTypeToJSType,
    convertDateToJSFDateTime: convertDateToJSFDateTime
}

/**
 * Returns a properly populated jsForce constructor dictionary based on the connector's config and provided headers.
 * @param headers
 * @returns {{loginUrl: *, logLevel: (*|exports.logLevel|opts.logLevel), accessToken: *, instanceUrl: *}}
 */
// function getOpts(config, headers) {
//     if (!headers) {
//         headers = {}
//     }
//     return {
//         loginUrl: headers.loginurl || config.url,
//         logLevel: config.logLevel,
//         accessToken: headers.accesstoken,
//         instanceUrl: headers.instanceurl || config.instanceUrl,
//         version: config.version
//     }
// }

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

/**
 * Convert Date filter props to SalesForce based date fields
 * @param {string} field Date in a string format
 * @param {string} fieldType Original type from salesforce schema
 * @returns object
 */
function convertDateToJSFDateTime(field, fieldType) {
    return fieldType === 'date' ? jsforce.Date.toDateLiteral(field) : jsforce.Date.toDateTimeLiteral(field)
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