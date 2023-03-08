import { setupFork } from '../steps/setup';
import { connectWallet, disconnectWallet } from '../steps/wallet';

describe('Test Connect Wallet', () => {
  const { visit, userAddress } = setupFork();

  before(() => {
    visit('/', { connectWallet: false });
  });

  after(() => {
    disconnectWallet();
  });

  it('Connects with injected connector', () => {
    connectWallet();

    cy.getByTestId('user-address')
      .should('be.visible')
      .and('contain', userAddress().substring(0, 6))
      .and('contain', userAddress().substring(38));
  });
});
