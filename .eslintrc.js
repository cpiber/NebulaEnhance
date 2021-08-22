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
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'array-bracket-newline': [
      'error',
      'consistent',
    ],
    'array-bracket-spacing': [
      'error',
      'always',
      { singleValue: false },
    ],
    'array-element-newline': [
      'error',
      'consistent',
    ],
    'arrow-spacing': 'error',
    'block-spacing': 'error',
    'brace-style': [
      'error',
      '1tbs',
    ],
    'camelcase': 'error',
    'comma-dangle': [
      'error',
      'always-multiline',
    ],
    'computed-property-spacing': [
      'error',
      'never',
    ],
    'func-call-spacing': [
      'error',
      'never',
    ],
    'indent': [
      'error',
      2,
      { SwitchCase: 1 },
    ],
    'key-spacing': 'error',
    'keyword-spacing': 'error',
    'linebreak-style': [
      'error',
      'unix',
    ],
    'new-cap': 'error',
    'new-parens': [
      'error',
      'always',
    ],
    'newline-per-chained-call': [
      'error',
      { ignoreChainWithDepth: 3 },
    ],
    'no-constant-condition': 'off',
    'no-duplicate-imports': 'error',
    'no-empty': 'off',
    'no-lonely-if': 'error',
    'no-multi-spaces': 'error',
    'no-trailing-spaces': 'error',
    'no-unneeded-ternary': 'error',
    'no-var': 'error',
    'object-curly-newline': [
      'error',
      { consistent: true },
    ],
    'object-curly-spacing': [
      'error',
      'always',
    ],
    'object-shorthand': [
      'error',
      'always',
    ],
    'operator-linebreak': [
      'error',
      'after',
    ],
    'padded-blocks': [
      'error',
      'never',
    ],
    'prefer-arrow-callback': 'error',
    'prefer-const': 'error',
    'prefer-destructuring': [
      'error',
      { object: true },
    ],
    'prefer-rest-params': 'off',
    'quote-props': [
      'error',
      'consistent-as-needed',
    ],
    'quotes': [
      'error',
      'single',
    ],
    'rest-spread-spacing': 'error',
    'semi': [
      'error',
      'always',
    ],
    'semi-spacing': 'error',
    'semi-style': [
      'error',
      'last',
    ],
    'sort-imports': [
      'error',
      { ignoreDeclarationSort: true },
    ],
    'space-before-blocks': 'error',
    'space-before-function-paren': [
      'error',
      { named: 'never' },
    ],
    'space-in-parens': [
      'error',
      'never',
    ],
    'space-infix-ops': 'error',
    'space-unary-ops': [
      'error',
      { nonwords: false, words: true },
    ],
    'template-curly-spacing': [
      'error',
      'never',
    ],
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
