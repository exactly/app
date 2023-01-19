type Params = {
  type: 'floating' | 'fixed';
  action: string;
  symbol: string;
  amount: number;
};

export const executeOperation = ({ type, action, symbol, amount }: Params) => {
  cy.getByTestId(`${type}-${action}-${symbol}`).click();
  cy.getByTestId(`modal-input`).type(`${amount}`);

  cy.waitUntil(
    () => cy.getByTestId('modal-submit', { timeout: 15000 }).then(($btn) => !$btn.hasClass('MuiLoadingButton-loading')),
    { timeout: 15000, interval: 1000 },
  );

  cy.getByTestId('modal').then(($modal) => {
    if ($modal.find('[data-testid="modal-approve"]').length) {
      cy.getByTestId('modal-approve', { timeout: 15000 }).click();
      cy.confirmMetamaskPermissionToSpend();
    }
  });

  cy.getByTestId('modal-submit', { timeout: 15000 }).click();
  cy.confirmMetamaskTransaction();
};

export const deposit = (params: Omit<Params, 'action'>) => {
  executeOperation({ action: 'deposit', ...params });
  cy.contains('Transaction Completed!').should('be.visible');
  cy.getByTestId('modal-close').click();
};
