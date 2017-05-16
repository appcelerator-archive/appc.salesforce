'use strict'

const jsforce = require('jsforce')
const async = require('async')

const sdkOpts = {
  loginUrl: '',
  logLevel: '',
  accessToken: null,
  instanceUrl: '',
  version: null
}

module.exports = function (options, callback) {
  sdkOpts.loginUrl = options.url
  const connection = new jsforce.Connection(sdkOpts)
  const username = options.username
  const password = options.password + options.token
  const api = {
    connection: connection,
    logout: logout,
    query: query,
    getDetailsForSObject: describe,
    getAllSObjectWithoutDetails: describeGlobal,
    search: search,
    identity: identity,
    limitInfo: limitInfo,
    apex: apex,
    sobject: {
      create: create,
      update: update,
      findByID: retrieve,
      deleteOne: destroy,
      find: find,
      limit: limit,
      sort: sort,
      skip: skip,
      execute: execute
    },
    chatter: {
      resource: resource
    },
    getSalesforceData: getSalesforceData,
    convertDateToJSFDateTime: convertDateToJSFDateTime
  }

  connection.login(username, password, (err, userInfo) => {
    if (err) {
      callback(err)
    } else {
      callback(null, api)
    }
  })

    /**
     * Convert Date filter props to SalesForce based date fields
     * @param {string} field Date in a string format
     * @param {string} fieldType Original type from salesforce schema
     * @returns object
     */
  function convertDateToJSFDateTime (field, fieldType) {
    return fieldType === 'date' ? jsforce.Date.toDateLiteral(field) : jsforce.Date.toDateTimeLiteral(field)
  }

  function logout (callback) {
    connection.logout(callback)
  }

  function getSalesforceData (options, callback) {
    const tasks = []
    var sObjectsMetadata = {}

    describeGlobal((err, res) => {
      if (err) {
        return callback(err)
      }

      res.sobjects.forEach(function (sobject) {
        if (sobject.deprecatedAndHidden) {
          return
        }
        if (options.generateModels !== undefined && options.generateModels.indexOf(sobject.name) === -1) {
          return
        }

        tasks.push(function (next) {
          describe(sobject.name, function (err, result) {
            if (err) {
              return next(err)
            }

            try {
              sObjectsMetadata[sobject.name] = result
              process.nextTick(next)
            } catch (error) {
              return next(error)
            }
          })
        })
      })

      async.parallelLimit(tasks, 100, function (err) {
        if (err) {
          return callback(err)
        }

        callback(null, sObjectsMetadata)
      })
    })
  }

  function describeGlobal (callback) {
    connection.describeGlobal(callback)
  }

  function describe (sObjectName, callback) {
    connection.describe(sObjectName, callback)
  }

  function query (stringQuery, callback) {
    connection.query(stringQuery, callback)
  }

  function search (sosl, callback) {
    connection.search(sosl, callback)
  }

  function identity (next) {
    connection.identity(next)
  }

  function limitInfo () {
    connection.limitInfo()
  }

  function getSObject (modelName) {
    var sObj = connection.sobject(modelName)
    if (!sObj) {
      throw new Error('invalid SF object named:' + modelName)
    }

    return sObj
  }

  function retrieve (modelName, id, callback) {
    getSObject(modelName).retrieve(id, callback)
  }

  function create (modelName, payload, callback) {
    getSObject(modelName).create(payload, callback)
  }

  function update (modelName, record, callback) {
    getSObject(modelName).update(record, callback)
  }

  function destroy (modelName, id, callback) {
    getSObject(modelName).destroy(id, callback)
  }

  function find (modelName, condition) {
    return getSObject(modelName).find(condition)
  }

  function limit (sobjects, num) {
    return sobjects.limit(num)
  }

  function skip (sobjects, num) {
    return sobjects.skip(num)
  }

  function sort (sobjects, condition) {
    return sobjects.sort(condition)
  }

  function execute (sobjects, callback) {
    sobjects.execute(callback)
  }

  function resource (resource) {
    return connection.chatter.resource(resource)
  }

  function apex (verb, path, body, callback) {
    connection.apex[verb](path, body, callback)
  }
}
