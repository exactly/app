import { Coin } from '../utils/tenderly';

export type Operation = 'deposit' | 'borrow' | 'withdraw' | 'repay';

export const open = (type: 'floating' | 'fixed', action: Operation, symbol: Coin) => {
  cy.getByTestId(`${type}-${action}-${symbol === 'ETH' ? 'WETH' : symbol}`).click();
  cy.getByTestId('modal').should('be.visible');
};

export const close = () => {
  cy.getByTestId('modal-close').click();
  cy.getByTestId('modal').should('not.exist');
};

export const input = (inp: string) => {
  cy.getByTestId('modal-input').type(inp);
};

export const checkInput = (inp: string) => {
  cy.getByTestId('modal-input').should('contain.value', inp);
};

export const clearInput = () => {
  cy.getByTestId('modal-input').clear();
};

export const onMax = () => {
  cy.getByTestId('modal-on-max').click();
};

export const waitForApprove = () => {
  cy.getByTestId('modal-approve').should('be.visible', { timeout: 30000 });
  cy.waitUntil(() => cy.getByTestId('modal-approve').then(($btn) => !$btn.hasClass('MuiLoadingButton-loading')), {
    timeout: 15000,
    interval: 1000,
  });
};

export const approve = () => {
  cy.getByTestId('modal-approve').should('not.be.disabled');
  cy.getByTestId('modal-approve').click();
};

export const approveIfRequired = () => {
  cy.getByTestId('modal').then(($modal) => {
    if ($modal.find('[data-testid="modal-approve"]').length) {
      approve();
    }
  });
};

export const waitForSubmit = () => {
  cy.waitUntil(() => cy.getByTestId('modal-submit').then(($btn) => !$btn.hasClass('MuiLoadingButton-loading')), {
    timeout: 15000,
    interval: 1000,
  });
};

export const submit = () => {
  cy.getByTestId('modal-submit').should('not.be.disabled');
  cy.getByTestId('modal-submit').click();
};

export const waitForTransaction = (op: Operation) => {
  cy.getByTestId('modal-transaction-status').should('be.visible', { timeout: 30000 });
  cy.waitUntil(
    () =>
      cy.getByTestId('modal').then(($modal) => {
        const text = $modal.find('[data-testid="modal-transaction-status"]').text();
        return text !== `Sending ${op}...`;
      }),
    {
      timeout: 15000,
      interval: 1000,
    },
  );
};

export const checkTransactionStatus = (target: 'success' | 'error', summary: string) => {
  cy.getByTestId('modal-transaction-status').should(
    'have.text',
    `Transaction ${target === 'success' ? 'completed' : target}`,
  );
  cy.getByTestId('modal-transaction-summary').should('have.text', summary);
};

export const checkTitle = (title: string) => {
  cy.getByTestId('modal-title').should('have.text', title);
};

export const checkType = (type: 'floating' | 'fixed') => {
  cy.getByTestId(`modal-type-switch-${type === 'floating' ? 'variable' : type}`).should(
    'have.attr',
    'aria-selected',
    'true',
  );
};

export const checkAssetSelection = (symbol: Coin) => {
  cy.getByTestId('modal-asset-selector').should('have.text', symbol);
};

export const checkWalletBalance = (balance: string) => {
  cy.getByTestId('modal-wallet-balance').should('contain.text', balance);
};

export const checkAlert = (variant: 'info' | 'warning' | 'error' | 'success', message: string) => {
  cy.getByTestId(`modal-alert-${variant}`).should('be.visible', message).and('have.text', message);
};

export const checkAlertNotFound = (variant: 'info' | 'warning' | 'error' | 'success') => {
  cy.getByTestId(`modal-alert-${variant}`).should('not.exist');
};
