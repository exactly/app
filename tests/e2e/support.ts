import 'cypress-wait-until';
import type { Eip1193Bridge } from '@ethersproject/experimental';

Cypress.Commands.add('getByTestId', (selector, ...args) => {
  return cy.get(`[data-testid=${selector}]`, ...args);
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      getByTestId(
        selector: string,
        options?: Partial<Loggable & Timeoutable & Withinable & Shadow>,
      ): Chainable<JQuery<Element>>;
    }
  }

  interface Window {
    rpcURL?: string;
    ethereum?: Eip1193Bridge;
  }
}
