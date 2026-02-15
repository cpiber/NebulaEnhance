/* eslint sort-keys: ['error'] */

module.exports = {
  extends: 'stylelint-config-standard-scss',
  rules: {
    'alpha-value-notation': 'number',
    'at-rule-empty-line-before': null,
    'at-rule-no-unknown': null,
    'color-hex-length': 'long',
    'custom-property-pattern': '.*',
    'font-family-no-missing-generic-family-keyword': null,
    'function-calc-no-unspaced-operator': true,
    'no-descending-specificity': null,
    'no-irregular-whitespace': true,
    'scss/at-rule-no-unknown': true,
    'scss/dollar-variable-pattern': null,
    'selector-attribute-quotes': 'always',
    'selector-class-pattern': null,
    'selector-id-pattern': null,
    'selector-type-case': 'lower',
    'value-keyword-case': 'lower',
  },
};