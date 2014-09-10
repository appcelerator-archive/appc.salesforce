# Salesforce Connector

This is a API Builder connector to Salesforce.

To install:

```bash
$ api install appc.salesforce --save
```

Use in your application:

```javascript
var Salesforce = require('appc.salesforce'),
	connector = new Salesforce({
		url: 'https://test.salesforce.com',
		username: '',
		password: '',
		token: ''
	});
```

Now reference the connector in your model.

```javascript
var Account = APIBuilder.createModel('Account',{
	fields: {
		Name: {type:'string', required: true, validator: /[a-zA-Z]{3,}/ }
	},
	connector: connector
});
```

If you want to map a specific model to a specific sobject name, use metadata.  For example, to map the `account` model to the sobject `Account`, set it such as:

```javascript
var User = APIBuilder.createModel('account',{
	fields: {
		Name: {type:'string', required: false, validator: /[a-zA-Z]{3,}/ }
	},
	connector: connector,
	metadata: {
		salesforce: {
			object: 'Account'
		}
	}
});
```
