import { mintDAI } from '../../utils/tenderly';

describe('Markets', () => {
  before(() => {
    cy.visit('/', {
      onBeforeLoad: function (window) {
        window.localStorage.setItem('tos', 'true');
      },
    });
    cy.get('[data-test-id=connect-wallet]').click();
    cy.get('w3m-modal').shadow().find('[name="MetaMask"]', { includeShadowDom: true }).click();
    cy.acceptMetamaskAccess();

    mintDAI('0x8967782Fb0917bab83F13Bd17db3b41C700b368D', 9999);
    cy.wait(999999);
  });

  after(() => {
    cy.disconnectMetamaskWalletFromAllDapps();
  });

  it('Floating Deposit WETH', () => {
    expectFloatingDepositSuccess('WETH');
  });

  it('Floating Deposit DAI', () => {
    expectFloatingDepositSuccess('DAI');
  });

  it('Floating Deposit USDC', () => {
    expectFloatingDepositSuccess('USDC');
  });

  it('Floating Deposit WBTC', () => {
    expectFloatingDepositSuccess('WBTC');
  });

  it('Floating Deposit wstETH', () => {
    expectFloatingDepositSuccess('wstETH');
  });
});

const expectFloatingDepositSuccess = (symbol: string) => {
  cy.getByDataTestId(`floating-deposit-${symbol}`).click();
  cy.getByDataTestId(`modal-input`).type('10');

  cy.waitUntil(
    () => cy.getByDataTestId('modal-submit', { timeout: 15000 }).then(($btn) => $btn.attr('disabled') !== 'disabled'),
    { timeout: 15000, interval: 1000 },
  );
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
