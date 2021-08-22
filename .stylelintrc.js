/* eslint sort-keys: ['error'] */

module.exports = {
  extends: 'stylelint-config-standard',
  plugins: [
    'stylelint-scss',
  ],
  rules: {
    'at-rule-empty-line-before': null,
    'at-rule-no-unknown': null,
    'color-hex-case': 'lower',
    'color-hex-length': 'long',
    'font-family-no-missing-generic-family-keyword': null,
    'function-calc-no-invalid': true,
    'function-calc-no-unspaced-operator': true,
    'indentation': 2,
    'linebreaks': 'unix',
    'no-irregular-whitespace': true,
    'number-leading-zero': 'always',
    'property-case': 'lower',
    'scss/at-rule-no-unknown': true,
    'selector-attribute-quotes': 'always',
    'selector-list-comma-newline-after': null,
    'selector-type-case': 'lower',
    'string-quotes': 'single',
    'unit-case': 'lower',
    'value-keyword-case': 'lower',
    'value-list-comma-space-after': 'always',
    'value-list-comma-space-before': 'never',
  },
};