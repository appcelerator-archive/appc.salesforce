'use strict'

const sinon = require('sinon')
const tap = require('tap')
const test = tap.test
const utils = require('../../../lib/utils/index')
const sandbox = sinon.sandbox

test('## getObjectFields - Should return fields from object ###', function (t) {
    const obj = {
        payloadKeys: () => { return ['key1', 'key2'] },
        getMeta: (fields) => { return ['key1', 'key2'] }
    }
    const fields = utils.getObjectFields(obj)

    t.ok(obj)
    t.equal(fields, 'key1,key2')
    t.end()
})

test('## getObjectFields - Should return key from object ###', function (t) {
    const obj = {
        payloadKeys: () => { return ['key1', 'key2'] },
        getMeta: (fields) => { return null }
    }
    const fields = utils.getObjectFields(obj)

    t.ok(obj)
    t.equal(fields, 'key1,key2')
    t.end()
})

test('## parseError - Should return error ###', function (t) {
    const err = 'Some error'
    const parseError = utils.parseError(err)

    t.ok(parseError)
    t.equal(parseError, err)
    t.end()
})

test('## parseError - Should return error message ###', function (t) {
    const err = { message: 'First error \n Second Error' }
    const parseError = utils.parseError(err)

    t.ok(parseError)
    t.equal(parseError.message, 'First error Second Error')
    t.end()
})

test('## convertDataTypeToJSType - a field with type string ###', function (t) {
    const field = { type: 'string' }
    const objectName = 'Name'
    const jsType = utils.convertDataTypeToJSType(field, objectName)

    t.ok(field)
    t.equal(jsType, field.type)
    t.end()
})

test('## convertDataTypeToJSType - a field with type object ###', function (t) {
    const field = { type: 'location' }
    const objectName = 'Name'
    const jsType = utils.convertDataTypeToJSType(field, objectName)

    t.ok(field)
    t.equal(jsType, 'object')
    t.end()
})

test('## convertDataTypeToJSType - a field with type date ###', function (t) {
    const field = { type: 'date' }
    const objectName = 'Name'
    const jsType = utils.convertDataTypeToJSType(field, objectName)

    t.ok(field)
    t.equal(jsType, field.type)
    t.end()
})

test('## convertDataTypeToJSType - a field with type boolean ###', function (t) {
    const field = { type: 'boolean' }
    const objectName = 'Name'
    const jsType = utils.convertDataTypeToJSType(field, objectName)

    t.ok(field)
    t.equal(jsType, field.type)
    t.end()
})

test('## convertDataTypeToJSType - a field with type number ###', function (t) {
    const field = { type: 'double' }
    const objectName = 'Name'
    const jsType = utils.convertDataTypeToJSType(field, objectName)

    t.ok(field)
    t.equal(jsType, 'number')
    t.end()
})

test('## convertDataTypeToJSType - a field with type string ###', function (t) {
    const field = { type: '' }
    const objectName = 'Name'
    const jsType = utils.convertDataTypeToJSType(field, objectName)

    t.ok(field)
    t.equal(jsType, 'string')
    t.end()
})