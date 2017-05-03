'use strict'

const Arrow = require('arrow')
const fs = require('fs')
const path = require('path')
const os = require('os')
const getModelDir = require('../connector-utils/getModelDir')

module.exports = function createModelsFromDir(connectorName, modelsMetadata) {
    var connector = Arrow.getConnector(connectorName)
    const modelDir = getModelDir(connector)

    // Set models to an empty object, in case we get an error, so versions of Arrow<1.4.9 don't choke.
    connector.models = {}

    cleanGeneratedModels(modelDir)
    persistModels(modelDir, modelsMetadata)

    connector.models = Arrow.loadModelsForConnector(connectorName, module, modelDir)
}

function cleanGeneratedModels(modelDir) {
    if (!fs.existsSync(modelDir)) {
        return
    }

    var models = fs.readdirSync(modelDir);
    for (var i = 0; i < models.length; i++) {
        var fileName = models[i]
        if (fileName.slice(-3) === '.js') {
            fs.unlinkSync(path.join(modelDir, fileName))
        }
    }
}

function persistModels(modelDir, modelsMetadata) {
    Object.keys(modelsMetadata).forEach(function (key) {
        var model = modelsMetadata[key]
        saveModelSync(model, modelDir)
    })
}

function saveModelSync(model, modelDir) {
    const buffer = `const Arrow = require('arrow')
var Model = Arrow.Model.extend('${model.connector}/${model.name}', ${JSON.stringify(model, null, '\t')})
module.exports = Model`

    fs.writeFileSync(path.join(modelDir, model.name.toLowerCase() + '.js'), buffer)
}

