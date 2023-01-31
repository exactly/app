import deposit from '../../steps/common/deposit';
import { connectMetamask, setupFork } from '../../steps/setup';

describe('WBTC floating deposit', () => {
  const { visit, setBalance, userAddress } = setupFork();

  before(() => {
    visit('/');
    connectMetamask();
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 100,
      WBTC: 100,
    });
  });

  after(() => {
    cy.disconnectMetamaskWalletFromAllDapps();
  });

  deposit({ symbol: 'WBTC', type: 'floating', decimals: 8, balance: '100.0', amount: '1', shouldApprove: true });
});
