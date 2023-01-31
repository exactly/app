import '@synthetixio/synpress/support';

Cypress.Commands.add('getByTestId', (selector, ...args) => cy.get(`[data-testid=${selector}]`, ...args));

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      getByTestId: typeof cy.get;
    }
  }

  interface Window {
    rpcURL?: string;
  }
}
