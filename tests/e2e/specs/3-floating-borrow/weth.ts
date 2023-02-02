import * as Navbar from '../../steps/nabvar';
import { deposit, enterMarket } from '../../steps/actions';
import borrow, { attemptBorrow } from '../../steps/common/borrow';
import { connectMetamask, setupFork } from '../../steps/setup';

describe('WETH floating borrow', () => {
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

  attemptBorrow({ type: 'floating', symbol: 'ETH', amount: '1' });

  describe('Setup environment for a successful borrow', () => {
    it('should go to the dashboard and enter market for ETH', () => {
      Navbar.goTo('dashboard');
      enterMarket({ symbol: 'ETH' });
    });

    it('should go to markets and deposit some ETH', () => {
      Navbar.goTo('markets');
      deposit({ symbol: 'ETH', type: 'floating', amount: '1' });
    });
  });

  borrow({
    type: 'floating',
    symbol: 'ETH',
    decimals: 18,
    amount: '0.1',
    aboveLimitAmount: '1',
    aboveLiquidityAmount: 1_000_000,
    shouldApprove: true,
  });
});
