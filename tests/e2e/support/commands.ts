Cypress.Commands.add('getByDataTestId', (selector, ...args) => {
  return cy.get(`[data-test-id=${selector}]`, ...args);
});
