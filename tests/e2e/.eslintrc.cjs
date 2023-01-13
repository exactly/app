/** @type {import('eslint').Linter.Config} */
module.exports = {
  env: {
    node: true,
    'cypress/globals': true,
  },
  extends: ['plugin:cypress/recommended', 'plugin:ui-testing/cypress', 'plugin:testing-library/react'],
};
