// Use this file as a starting point for your project's .eslintrc.
// Copy this file, and add rule overrides as needed.
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  env: {
    browser: true,
    es6: true,
    node: false,
  },
  plugins: ['@typescript-eslint', 'simple-import-sort'],
  rules: {
    'no-shadow': 'error',
    'no-template-curly-in-string': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'simple-import-sort/sort': [
      'error',
      {
        groups: [
          // Side effect imports.
          ['^\\u0000'],
          // Node package
          [`^(${require('module').builtinModules.join('|')})(/|$)`],
          // 3rd party packages
          ['^\\w'],
          // Our packages
          ['^@lib/'],
          // Internal package refs
          ['^(@src/|@test)'],
          // Absolute imports
          ['^[^.]'],
          // Relative imports
          ['^\\.'],
        ],
      },
    ],
    'import/order': 'off',
  },
};
