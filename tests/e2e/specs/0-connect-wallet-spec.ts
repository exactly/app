import { connectMetamask } from '../steps/setup';

describe('Test Connect Wallet', () => {
  let userAddress: string | undefined;

  before(() => {
    cy.visit('/', {
      onBeforeLoad: function (window) {
        window.localStorage.setItem('tos', 'true');
      },
    });
    cy.fetchMetamaskWalletAddress().then((address) => (userAddress = address));
  });

  after(() => {
    cy.disconnectMetamaskWalletFromAllDapps();
  });

  it('Connects with Metamask', () => {
    connectMetamask();

    cy.getByTestId('user-address')
      .should('be.visible')
      .and('contain', userAddress?.substring(0, 6))
      .and('contain', userAddress?.substring(38));
  });
});
