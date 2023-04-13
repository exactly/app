import { ERC20TokenSymbol } from '../utils/contracts';

export const checkCollateralSwitchStatus = (symbol: ERC20TokenSymbol, disabled: boolean, checked: boolean) => {
  cy.getByTestId(`switch-collateral-${symbol}`)
    .should('exist')
    .and(disabled ? 'be.disabled' : 'not.be.disabled')
    .and(checked ? 'be.checked' : 'not.be.checked');
};

export const checkCollateralSwitchTooltip = (symbol: ERC20TokenSymbol, tooltip: string) => {
  cy.getByTestId(`switch-collateral-${symbol}-wrapper`).trigger('mouseover');
  cy.getByTestId(`switch-collateral-${symbol}-tooltip`).should('be.visible').and('have.text', tooltip);
  cy.getByTestId(`switch-collateral-${symbol}-wrapper`).trigger('mouseout');
};

export const attemptEnterMarket = (symbol: ERC20TokenSymbol) => {
  checkCollateralSwitchStatus(symbol, false, false);
  cy.getByTestId(`switch-collateral-${symbol}-wrapper`).trigger('mouseover');
  cy.getByTestId(`switch-collateral-${symbol}`).click();
};

export const attemptExitMarket = (symbol: ERC20TokenSymbol) => {
  checkCollateralSwitchStatus(symbol, false, true);
  cy.getByTestId(`switch-collateral-${symbol}-wrapper`).trigger('mouseover');
  cy.getByTestId(`switch-collateral-${symbol}`).click();
};

export const checkCollateralSwitchStatusLoading = (symbol: ERC20TokenSymbol) => {
  cy.getByTestId(`switch-collateral-${symbol}-loading`).should('be.visible');
};

export const waitForTransaction = (symbol: ERC20TokenSymbol) => {
  checkCollateralSwitchStatusLoading(symbol);
  cy.waitUntil(
    () =>
      cy
        .getByTestId(`dashboard-floating-pool-row-${symbol}`)
        .then(($row) => $row.find(`[data-testid="switch-collateral-${symbol}-loading"]`).length === 0),
    {
      timeout: 30000,
      interval: 1000,
    },
  );
};

export const switchTab = (tab: 'deposit' | 'borrow') => {
  cy.getByTestId(`tab-${tab}`).should('be.visible').click();
};

export const checkFixedTableRow = (type: 'deposit' | 'borrow', symbol: ERC20TokenSymbol, maturity: number) => {
  cy.getByTestId(`dashboard-fixed-${type}-row-${maturity}-${symbol}`).should('be.visible');
};
