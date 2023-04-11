import { deposit, enterMarket, reload } from '../../steps/actions';
import borrow, { attemptBorrow } from '../../steps/common/borrow';
import { setupFork } from '../../steps/setup';

describe('WETH floating borrow', () => {
  const { visit, setBalance, userAddress, signer } = setupFork();

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
    enterMarket('WETH', signer);
    deposit({ symbol: 'ETH', amount: '1', receiver: userAddress() }, signer);

    reload();
  });

  borrow({
    type: 'floating',
    symbol: 'WETH',
    amount: '0.1',
    aboveLimitAmount: '1',
    aboveLiquidityAmount: 1_000_000,
    shouldApprove: true,
  });
});
