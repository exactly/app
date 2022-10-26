const { include: devFiles } = require('./tsconfig.dev.json');

/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: { project: ['tsconfig.json', 'tsconfig.dev.json'] },
  settings: { 'import/resolver': 'typescript' },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:prettier/recommended',
    'plugin:eslint-comments/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@next/next/recommended',
  ],
  rules: {
    'no-console': 'warn', // HACK set to error
    '@typescript-eslint/no-shadow': 'warn', // HACK set to error
    'eslint-comments/no-unused-disable': 'error',
    '@typescript-eslint/no-explicit-any': 'warn', // HACK set to error
    '@typescript-eslint/no-floating-promises': 'warn', // HACK set to error
    '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
  },
  overrides: [
    {
      files: devFiles,
      extends: ['plugin:node/recommended'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules', 'dynamicImport'] }],
      },
    },
  ],
};
