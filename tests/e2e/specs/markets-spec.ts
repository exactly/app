describe('Markets', () => {
  before(() => {
    cy.visit('/', {
      onBeforeLoad: function (window) {
        window.localStorage.setItem('tos', 'true');
      },
    });
    cy.get('[data-test-id=connect-wallet]').click();
    cy.get('w3m-modal').shadow().find('[name="MetaMask"]', { includeShadowDom: true }).click();
    // cy.acceptMetamaskAccess();
  });

  // eslint-disable-next-line ui-testing/missing-assertion-in-test
  it('Floating Deposit WETH', () => {
    testDepositFloatingPools('WETH');
  });

  // eslint-disable-next-line ui-testing/missing-assertion-in-test
  it('Floating Deposit DAI', () => {
    testDepositFloatingPools('DAI');
  });

  // eslint-disable-next-line ui-testing/missing-assertion-in-test
  it('Floating Deposit USDC', () => {
    testDepositFloatingPools('USDC');
  });

  // eslint-disable-next-line ui-testing/missing-assertion-in-test
  it('Floating Deposit WBTC', () => {
    testDepositFloatingPools('WBTC');
  });

  // eslint-disable-next-line ui-testing/missing-assertion-in-test
  it('Floating Deposit wstETH', () => {
    testDepositFloatingPools('wstETH');
  });
});

const testDepositFloatingPools = (symbol: string) => {
  cy.getByDataTestId(`floating-deposit-${symbol}`).click();
  cy.getByDataTestId(`modal-input`).type('10');

  // eslint-disable-next-line cypress/no-unnecessary-waiting, ui-testing/no-hard-wait, testing-library/await-async-utils
  cy.wait(10000); // TODO: try to avoid this wait
  cy.getByDataTestId('modal').then(($modal) => {
    if ($modal.find('[data-test-id=modal-approve]').length) {
      cy.getByDataTestId('modal-approve', { timeout: 15000 }).click();
      cy.confirmMetamaskPermissionToSpend();
    }
  });

  cy.getByDataTestId('modal-submit', { timeout: 15000 }).click();
  cy.confirmMetamaskTransaction();

  cy.contains('Transaction Completed!').should('be.visible');
  cy.getByDataTestId('modal-close').click();
};
