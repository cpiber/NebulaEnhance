module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    'indent': [
      'error',
      2,
      { SwitchCase: 1 },
    ],
    'linebreak-style': [
      'error',
      'unix',
    ],
    'quotes': [
      'error',
      'single',
    ],
    'quote-props': [
      'error',
      'consistent-as-needed',
    ],
    'semi': [
      'error',
      'always',
    ],
    'comma-dangle': [
      'error',
      'always-multiline',
    ],
    'brace-style': [
      'error',
      '1tbs',
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-constant-condition': 'off',
    'no-empty': 'off',
    'prefer-rest-params': 'off',
    'no-case-declarations': 'warn',
  },
  overrides: [
    {
      files: ['tests/**/*.ts'],
      env: {
        jest: true,
      },
      rules: {
        'no-global-assign': 'off',
        '@typescript-eslint/triple-slash-reference': 'off',
      },
    },
    {
      files: ['*.js'],
      env: {
        browser: false,
        node: true,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
