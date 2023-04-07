# aws-tut-2

## Some learned things of note
1. Only a certain set of fields are permitted in a Lambda function return value. The inclusion of any other fields will result in the API Gateway connected to the lambda function responding with a `502 bad gateway` and `{ message: 'Internal Server Error'}` response
2. Relative path `imports` or `requires` from Node.js code in a Lambda **MUST** include the file type extension. That goes for `.js` also
3. The `aws-sdk` packages are available by default within Node.js Lambda contexts
4. Using full programming languages for dev ops (deployment) may be better thab makefile and shell scripts when the complexity of the dev ops process in question increases
5. Should not include linting and testing code and packages whin the Lambda function package itself. Instead, its a good idea to wrap the Lambda function package in a larger package that handles all of that good stuff for it