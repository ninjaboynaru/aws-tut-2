const rules = require('./rules/index.cjs')

module.exports = {
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		strict: true,
	},
	env: {
		node: true
	},
	plugins: ['import'],
	extends: ['eslint-config-airbnb-base'],
	rules: {
		...rules
	}
}
