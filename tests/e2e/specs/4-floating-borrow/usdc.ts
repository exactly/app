import * as navbar from '../../steps/navbar';
import * as dashboard from '../../steps/dashboard';
import { deposit, enterMarket, reload } from '../../steps/actions';
import borrow, { attemptBorrow } from '../../steps/common/borrow';
import { setupFork } from '../../steps/setup';

describe('USDC floating borrow', () => {
  const { visit, setBalance, userAddress, signer } = setupFork();

  before(() => {
    visit('/');
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 100,
    });
  });

  attemptBorrow({ type: 'floating', symbol: 'USDC', amount: '10' });

  describe('Setup environment for a successful borrow using ETH without entering USDC market', () => {
    enterMarket('WETH', signer);
    deposit({ symbol: 'ETH', amount: '1.5', receiver: userAddress() }, signer);

    reload();
  });

  borrow({
    type: 'floating',
    symbol: 'USDC',
    amount: '1',
    aboveLiquidityAmount: 1_000_000_000,
  });

  describe('dashboard after borrow', () => {
    it('should navigate to dashboard', () => {
      navbar.goTo('dashboard');
    });

    it('should have both USDC and ETH collateral switch checked and disabled', () => {
      dashboard.checkCollateralSwitchStatus('USDC', true, true);
      dashboard.checkCollateralSwitchStatus('WETH', true, true);
    });

    it('should have both USDC and ETH switches with a tooltip explaining why are disabled', () => {
      dashboard.checkCollateralSwitchTooltip(
        'WETH',
        'Disabling this collateral will make your health factor less than 1',
      );
      dashboard.checkCollateralSwitchTooltip(
        'USDC',
        "You can't disable collateral on this asset because you have an active borrow",
      );
    });
  });
});
