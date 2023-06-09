const { include: devFiles } = require('./tsconfig.dev.json');

/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: { project: ['tsconfig.json', 'tsconfig.dev.json'] },
  settings: { react: { version: 'detect' }, 'import/resolver': 'typescript' },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'plugin:react-hooks/recommended',
    'plugin:eslint-comments/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@next/next/recommended',
  ],
  ignorePatterns: ['types/abi.ts'],
  rules: {
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'no-console': 'error',
    '@typescript-eslint/no-shadow': 'error',
    'eslint-comments/no-unused-disable': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
  },
  overrides: [
    {
      files: devFiles,
      extends: ['plugin:node/recommended'],
      rules: {
        'node/no-missing-import': ['error', { tryExtensions: ['.ts', '.js', '.json'] }],
        'node/no-unpublished-import': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules', 'dynamicImport'] }],
      },
    },
  ],
};
