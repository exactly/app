import * as navbar from '../../steps/navbar';
import * as dashboard from '../../steps/dashboard';
import { checkBalance, deposit, enterMarket, reload } from '../../steps/actions';
import borrow, { attemptBorrow } from '../../steps/common/borrow';
import { setup } from '../../steps/setup';
import repay from '../../steps/common/repay';

describe('USDC floating borrow/repay', () => {
  const { visit, setBalance, userAddress, walletClient, publicClient } = setup();

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
    enterMarket('WETH', walletClient);
    deposit({ symbol: 'ETH', amount: '10', receiver: userAddress() }, walletClient, publicClient);

    reload();
  });

  borrow({
    type: 'floating',
    symbol: 'USDC',
    amount: '50',
    aboveLiquidityAmount: 1_000_000_000,
  });

  describe('Status after borrow', () => {
    checkBalance({ address: userAddress(), symbol: 'USDC', amount: '50' }, publicClient);

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

    it('should switch to borrows', () => {
      dashboard.switchTab('borrow');
    });
  });

  repay({
    type: 'floating',
    symbol: 'USDC',
    amount: '25',
    shouldApprove: true,
  });

  describe('Status after repay', () => {
    checkBalance({ address: userAddress(), symbol: 'USDC', amount: '25', delta: 0.00005 }, publicClient);
  });
});
