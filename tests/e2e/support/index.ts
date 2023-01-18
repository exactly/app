import './commands';
import '@synthetixio/synpress/support/index';

declare global {
  namespace Cypress {
    interface Chainable {
      getByDataTestId(
        value: string,
        options?: Partial<Loggable & Timeoutable & Withinable & Shadow>,
      ): Chainable<JQuery<HTMLElement>>;
    }
  }
}
