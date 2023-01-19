import { connectMetamask, setupFork } from '../steps/setup';

describe('Test Connect Wallet', () => {
  const { visit, userAddress } = setupFork();

  before('Visit web page', () => {
    visit('/');
  });

  after(() => {
    cy.disconnectMetamaskWalletFromAllDapps();
  });

  it('Connects with Metamask', () => {
    connectMetamask();

    cy.getByTestId('user-address')
      .should('be.visible')
      .and('contain', userAddress()?.substring(0, 6))
      .and('contain', userAddress()?.substring(38));
  });
});
