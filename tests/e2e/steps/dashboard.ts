import { Coin } from '../utils/tenderly';

export const checkCollateralSwitchStatus = (symbol: Coin, disabled: boolean, checked: boolean) => {
  cy.getByTestId(`switch-collateral-${symbol}`)
    .should('exist')
    .and(disabled ? 'be.disabled' : 'not.be.disabled')
    .and(checked ? 'be.checked' : 'not.be.checked');
};

export const checkCollateralSwitchTooltip = (symbol: Coin, tooltip: string) => {
  cy.getByTestId(`switch-collateral-${symbol}-wrapper`).trigger('mouseover');
  cy.getByTestId(`switch-collateral-${symbol}-tooltip`).should('be.visible').and('have.text', tooltip);
};

export const attemptEnterMarket = (symbol: Coin) => {
  checkCollateralSwitchStatus(symbol, false, false);
  cy.getByTestId(`switch-collateral-${symbol}`).click();
};

export const attemptExitMarket = (symbol: Coin) => {
  checkCollateralSwitchStatus(symbol, false, true);
  cy.getByTestId(`switch-collateral-${symbol}`).click();
};

export const checkCollateralSwitchStatusLoading = (symbol: Coin) => {
  cy.getByTestId(`switch-collateral-${symbol}-loading`).should('be.visible');
};

export const waitForTransaction = (symbol: Coin) => {
  checkCollateralSwitchStatusLoading(symbol);
  cy.waitUntil(
    () =>
      cy
        .getByTestId(`dashboard-floating-pool-row-${symbol}`)
        .then(($row) => $row.find(`[data-testid="switch-collateral-${symbol}-loading"]`).length === 0),
    {
      timeout: 15000,
      interval: 1000,
    },
  );
};
