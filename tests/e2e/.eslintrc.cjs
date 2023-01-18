/** @type {import('eslint').Linter.Config} */
module.exports = {
  parserOptions: { tsconfigRootDir: __dirname },
  env: {
    node: true,
    'cypress/globals': true,
  },
  rules: {
    '@typescript-eslint/no-namespace': 'off',
  },
  extends: ['plugin:cypress/recommended', 'plugin:ui-testing/cypress', 'plugin:testing-library/react'],
};
