/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    'plugin:cypress/recommended',
    'plugin:ui-testing/cypress',
    'plugin:chai-expect/recommended',
    'plugin:chai-friendly/recommended',
    'plugin:testing-library/react',
  ],
  rules: {
    'ui-testing/missing-assertion-in-test': 0,
    'testing-library/prefer-screen-queries': 0,
  },
};
