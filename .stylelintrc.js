module.exports = {
  extends: 'stylelint-config-standard',
  plugins: [
    'stylelint-scss',
  ],
  rules: {
    'at-rule-no-unknown': null,
    'at-rule-empty-line-before': null,
    'selector-list-comma-newline-after': null,
    'font-family-no-missing-generic-family-keyword': null,
    'scss/at-rule-no-unknown': true,
    'indentation': 2,
  },
};