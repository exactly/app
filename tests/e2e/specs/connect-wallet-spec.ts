import { mintDAI } from '../../utils/tenderly';

describe('Test Connect Wallet', () => {
  let userAddress: string | undefined;

  before(() => {
    cy.getMetamaskWalletAddress().then((address) => (userAddress = address));
    cy.visit('/', {
      onBeforeLoad: function (window) {
        window.localStorage.setItem('tos', 'true');
      },
    });

    mintDAI('0x8967782Fb0917bab83F13Bd17db3b41C700b368D', 9999);
    cy.wait(999999);
  });

  after(() => {
    cy.disconnectMetamaskWalletFromAllDapps();
  });

  it('Connects with Metamask', () => {
    cy.getByDataTestId('connect-wallet').click();
    cy.get('w3m-modal').shadow().find('[name="MetaMask"]', { includeShadowDom: true }).click();
    cy.acceptMetamaskAccess();

    cy.getByDataTestId('user-address')
      .should('be.visible')
      .and('contain', userAddress?.substring(0, 6))
      .and('contain', userAddress?.substring(38));
  });
});
