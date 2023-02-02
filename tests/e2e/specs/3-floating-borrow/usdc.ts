import * as Navbar from '../../steps/nabvar';
import * as Dashboard from '../../steps/dashboard';
import { deposit, enterMarket } from '../../steps/actions';
import borrow, { attemptBorrow } from '../../steps/common/borrow';
import { connectMetamask, setupFork } from '../../steps/setup';

describe('USDC floating borrow', () => {
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

  attemptBorrow({ type: 'floating', symbol: 'USDC', amount: '10' });

  describe('Setup environment for a successful borrow using ETH without entering USDC market', () => {
    it('should go to the dashboard and enter market for ETH', () => {
      Navbar.goTo('dashboard');
      enterMarket({ symbol: 'ETH' });
    });

    it('should go to markets and deposit some ETH', () => {
      Navbar.goTo('markets');
      deposit({ symbol: 'ETH', type: 'floating', amount: '0.01' });
    });
  });

  borrow({
    type: 'floating',
    symbol: 'USDC',
    decimals: 6,
    amount: '1',
    aboveLiquidityAmount: 1_000_000_000,
  });

  describe('Dashboard after borrow', () => {
    it('should navigate to dashboard', () => {
      Navbar.goTo('dashboard');
    });

    it('should have both USDC and ETH collateral switch checked and disabled', () => {
      Dashboard.checkCollateralSwitchStatus('USDC', true, true);
      Dashboard.checkCollateralSwitchStatus('WETH', true, true);
    });

    it('should have both USDC and ETH switches with a tooltip explaining why are disabled', () => {
      Dashboard.checkCollateralSwitchTooltip(
        'WETH',
        'Disabling this collateral will make your health factor less than 1',
      );
      Dashboard.checkCollateralSwitchTooltip(
        'USDC',
        "You can't disable collateral on this asset because you have an active borrow",
      );
    });
  });
});
