import deposit from '../../steps/common/deposit';
import { connectMetamask, setupFork } from '../../steps/setup';

describe('WETH floating deposit', () => {
  const { visit, setBalance, userAddress } = setupFork();

  before(() => {
    visit('/');
    connectMetamask();
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 100,
    });
  });

  after(() => {
    cy.disconnectMetamaskWalletFromAllDapps();
  });

  deposit({ type: 'floating', symbol: 'ETH', decimals: 18, balance: '100.0', amount: '10' });
});
