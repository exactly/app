import { formatMaturity } from '../utils/strings';

export const switchTab = (tab: 'deposit' | 'borrow') => {
  cy.getByTestId(`simple-view-${tab}-tab`).click();
};

export const tabIsActive = (tab: 'deposit' | 'borrow') => {
  cy.getByTestId(`simple-view-${tab}-tab`).should('have.attr', 'data-active', 'true');
};

export const checkAction = (action: string) => {
  cy.getByTestId('simple-view-asset-action').should('have.text', action);
};

export const checkOptionExists = (maturity: number) => {
  cy.getByTestId(`simple-view-maturity-option-${maturity}`).should('be.visible');
};

export const selectOption = (maturity: number) => {
  cy.getByTestId(`simple-view-maturity-option-${maturity}`).click();
};

export const checkBalanceVisible = (visible: boolean) => {
  cy.getByTestId('modal-amount-info').should(visible ? 'be.visible' : 'not.exist');
};

export const waitForViewReady = () => {
  cy.waitUntil(
    () =>
      cy.getByTestId('simple-view').then(($view) => {
        return ['submit', 'approve'].every((action) => {
          const $btn = $view.find(`[data-testid="modal-${action}"]`);
          if ($btn.length) {
            return !$btn.hasClass('MuiLoadingButton-loading');
          }
          return true;
        });
      }),
    {
      timeout: 15000,
      interval: 1000,
    },
  );
};

export const checkOverviewVisible = (visible: boolean) => {
  cy.getByTestId('simple-view-overview').should(visible ? 'be.visible' : 'not.exist');
};

export const checkMaturityDate = (maturity: number) => {
  cy.getByTestId('simple-view-overview-maturity').should('have.text', formatMaturity(maturity));
};

export const connectUsingView = () => {
  cy.getByTestId('modal-connect-wallet').should('be.visible').click();
};

export { checkAssetSelection, input, checkInput, checkAlert } from './modal';
