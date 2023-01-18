/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    'plugin:mocha/recommended',
    'plugin:cypress/recommended',
    'plugin:ui-testing/cypress',
    'plugin:chai-expect/recommended',
    'plugin:chai-friendly/recommended',
    'plugin:testing-library/react',
  ],
  rules: {
    'mocha/no-mocha-arrows': 'off',
    'mocha/no-exclusive-tests': 'error',
  },
};
