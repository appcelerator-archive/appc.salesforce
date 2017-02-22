#!groovy
@Library('pipeline-library') _

timestamps {
	node('git && (osx || linux)') {
		stage('Checkout') {
			checkout scm
		}

		stage('Configuration') {
			sh "echo \"module.exports = { logLevel: 'error', connectors: { 'appc.salesforce.1': { connector: 'appc.salesforce', requireSessionLogin: false, url: 'https://test.salesforce.com/', username: 'dtoth@appcelerator.com.appcdev', password: 'mmpResearch4', token: '4qEFyGMb5r0VYZPZBj99Rjukv', schemaRefresh: 3.6e+6 * 24, /* one day*/ modelAutogen: true, generateModelsFromSchema: true, generateModels: ['Account', 'Contract', 'FieldDefinition'] }, 'appc.salesforce.2': { connector: 'appc.salesforce', requireSessionLogin: false, url: 'https://test.salesforce.com/', username: 'dtoth@appcelerator.com.appcdev', password: 'mmpResearch4', token: '4qEFyGMb5r0VYZPZBj99Rjukv', schemaRefresh: 3.6e+6 * 24, /* one day*/ modelAutogen: true, generateModelsFromSchema: true, generateModels: ['Account', 'Contract'] }} };\" > conf/local.js"
		}

		buildConnector {
			// don't override anything yet
		}
	}
}
