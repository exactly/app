import { enterMarket, exitMarket } from '../../steps/common/market';
import { connectMetamask, setupFork } from '../../steps/setup';

describe('WETH enter/exit market', () => {
  const { visit, setBalance, userAddress } = setupFork();

  before(() => {
    visit('/dashboard');
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

  enterMarket({ symbol: 'WETH' });

  exitMarket({ symbol: 'WETH' });
});
