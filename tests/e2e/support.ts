import 'cypress-wait-until';
import type { Eip1193Bridge } from '@ethersproject/experimental';

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
    ethereum?: Eip1193Bridge;
  }
}
