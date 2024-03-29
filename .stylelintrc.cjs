/* eslint sort-keys: ['error'] */

module.exports = {
  extends: 'stylelint-config-standard-scss',
  rules: {
    'alpha-value-notation': 'number',
    'at-rule-empty-line-before': null,
    'at-rule-no-unknown': null,
    'color-hex-case': 'lower',
    'color-hex-length': 'long',
    'font-family-no-missing-generic-family-keyword': null,
    'function-calc-no-unspaced-operator': true,
    'indentation': 2,
    'linebreaks': 'unix',
    'max-line-length': null,
    'no-irregular-whitespace': true,
    'number-leading-zero': 'always',
    'property-case': 'lower',
    'scss/at-rule-no-unknown': true,
    'scss/dollar-variable-pattern': null,
    'selector-attribute-quotes': 'always',
    'selector-class-pattern': null,
    'selector-id-pattern': null,
    'selector-list-comma-newline-after': null,
    'selector-type-case': 'lower',
    'string-quotes': 'single',
    'unit-case': 'lower',
    'value-keyword-case': 'lower',
    'value-list-comma-space-after': 'always',
    'value-list-comma-space-before': 'never',
  },
};