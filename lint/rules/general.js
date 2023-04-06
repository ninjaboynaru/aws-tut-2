const disables = {
	'no-tabs': 0,
	'no-param-reassign': 0,
	'no-continue': 0,
	'max-len': 0,
	'consistent-return': 0,
	'prefer-destructuring': 0,
	'no-restricted-syntax': 0,
	'default-case': 0,
	'no-console': 0
}

const rules = {
	semi: [2, 'never'],
	indent: [2, 'tab'],
	quotes: [2, 'single'],
	'comma-dangle': [2, 'never'],
	'brace-style': [2, 'stroustrup', { allowSingleLine: true }],
	'linebreak-style': [2, 'unix'],
	'prefer-const': 2,
	'no-var': 2,
	'object-curly-newline': [2, { consistent: true }]
}

module.exports = { ...disables, ...rules }
