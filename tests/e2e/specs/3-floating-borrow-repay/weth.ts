import { deposit, enterMarket, reload } from '../../steps/actions';
import borrow, { attemptBorrow } from '../../steps/common/borrow';
import repay from '../../steps/common/repay';
import { setup } from '../../steps/setup';

describe('WETH floating borrow/repay', () => {
  const { visit, setBalance, userAddress, walletClient, publicClient } = setup();

  before(() => {
    visit('/');
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 100,
    });
  });

  attemptBorrow({ type: 'floating', symbol: 'WETH', amount: '1' });

  describe('Setup environment for a successful borrow', () => {
    enterMarket('WETH', walletClient);
    deposit({ symbol: 'ETH', amount: '1', receiver: userAddress() }, walletClient, publicClient);

    reload();
  });

  borrow({
    type: 'floating',
    symbol: 'WETH',
    amount: '0.5',
    aboveLimitAmount: 10,
    aboveLiquidityAmount: 10_000_000,
    shouldApprove: true,
  });

  repay({
    type: 'floating',
    symbol: 'WETH',
    amount: '0.25',
  });
});
