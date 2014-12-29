var async = require('async'),
	fs = require('fs'),
	path = require('path'),
	_ = require('lodash');


/**
 * generate SF models from a schema into modelDir
 */
exports.generateModels = function(connectorName, modelDir, schema, autogen, cb) {
	async.eachSeries(_.keys(schema.objects), function(objectName, done) {
		var obj = schema.objects[objectName],
			model = {
				// description: obj.label,
				name: objectName,
				fields: {},
				connector: connectorName,
				autogen: autogen,
				metadata: {}
			};

		// add the object name in case we extend this model, we want to retain the 
		// underlying SF objectname
		model.metadata[connectorName] = {
			'object': objectName,
			'fields': []
		};

		for (var i = 0; i < obj.fields.length; i++) {
			var field = obj.fields[i];
			if (field.name === 'Id') {
				// skip built-in primary key. we handle that special in the connector
				continue;
			}
			var newField = model.fields[field.name] = {
				name: field.name,
				type: translateFieldToType(field),
				description: field.label,
				readonly: !!field.calculated,
				maxlength: field.length || undefined
			};
			if (field.defaultValue) {
				newField.default = field.defaultValue;
			}
			if (!field.nillable && !field.defaultValue) {
				newField.required = true;
			}
			model.metadata[connectorName].fields.push(field.name);
		}

		var buffer = "var APIBuilder = require('apibuilder');\n\n";
		buffer += "var Model = APIBuilder.Model.extend('" + connectorName + "/" + objectName + "'," + JSON.stringify(model, null, '\t') + ");\n\n";
		buffer += "module.exports = Model;\n";

		fs.writeFile(path.join(modelDir, objectName.toLowerCase() + '.js'), buffer, done);
	}, cb);
};

function translateFieldToType(field) {
	if (field.type in {
			string: 1, id: 1, reference: 1, email: 1, textarea: 1, phone: 1, url: 1, picklist: 1, anyType: 1,
			address: 1, combobox: 1, datacategorygroupreference: 1, encryptedstring: 1
		}) {
		return 'string';
	}
	if (field.type in { location: 1, multipicklist: 1 }) {
		return 'object';
	}
	if (field.type in { date: 1, time: 1, datetime: 1 }) {
		return 'date';
	}
	if (field.type in { boolean: 1 }) {
		return 'boolean';
	}
	if (field.type in { int: 1, percent: 1, double: 1, currency: 1, base64: 1 }) {
		return 'number';
	}
	console.error('Not sure how to handle type: "' + field.type + '"; using "String" as a default...');
	return 'string';
}
