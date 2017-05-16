'use strict'

const tap = require('tap')
const test = tap.test
const fetchMetadata = require('./../../../lib/metadata/fetchMetadata').fetchMetadata
const sinon = require('sinon')

const sandbox = sinon.sandbox.create()

test('### fetchMetadata test response, fields name, type and required ###', (t) => {
  // Spy
  const nextSpy = sandbox.spy()

  // Execution
  fetchMetadata(nextSpy)

  // Tests
  const fields = nextSpy.args[0][1].fields

  t.ok(nextSpy.calledOnce)

  t.equal(fields[0].name, 'url')
  t.equal(fields[0].type, 'text')
  t.equal(fields[0].required, true)

  t.equal(fields[1].name, 'username')
  t.equal(fields[1].type, 'text')
  t.equal(fields[1].required, true)

  t.equal(fields[2].name, 'password')
  t.equal(fields[2].type, 'text')
  t.equal(fields[2].required, true)

  t.equal(fields[3].name, 'token')
  t.equal(fields[3].type, 'text')
  t.equal(fields[3].required, false)

  sandbox.restore()
  t.end()
})
