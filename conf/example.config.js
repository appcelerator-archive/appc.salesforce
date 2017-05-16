module.exports = {
  connectors: {
    'appc.salesforce': {
      /*
      requireSessionLogin allows you to configure whether or not anonymous requests can use your default
      account (specified below) for connecting to Salesforce. Set this to "true" to require requests to specify
      their own credentials or their own session token (via the headers user, pass, and token, or accessToken).
      */
      requireSessionLogin: false,

      /*
      Configure how to connect to your instance; this will be used for looking up metadata and,
      if requireSessionLogin is false, for executing methods.
      */
      url: 'https://test.salesforce.com/',
      username: 'your_salesforce_username',
      password: 'your_salesforce_password',
      token: 'your_salesforce_token',

    /*
      Other settings.
      */
      schemaRefresh: 3.6e+6 * 24, // how long the cache will live (one day); set to "false" to disable caching.

      // Create models based on your schema that can be used in your API.
      generateModelsFromSchema: true,

      // Whether or not to generate APIs based on the methods in generated models.
      modelAutogen: false

      // If you want to use a specific version of the Salesforce API, uncomment and customize the following:
      // version: '26.0'

      // If you only want to generate a couple of models from the schema, uncomment and customize the following:
      /* generateModels: [
        'Account',
        'Contract'
        ] */
    }
  }
}
