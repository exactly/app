import * as navbar from '../../steps/navbar';
import { deposit, reload } from '../../steps/actions';
import withdraw, { attemptWithdraw } from '../../steps/common/withdraw';
import { setupFork } from '../../steps/setup';

describe('WETH floating withdraw', () => {
  const { visit, setBalance, userAddress, signer } = setupFork();

  before(() => {
    visit('/').then(() => navbar.goTo('dashboard'));
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 100,
    });
  });

  attemptWithdraw({ type: 'floating', symbol: 'WETH', amount: '1' });

  describe('Setup environment for a successful withdraw', () => {
    deposit({ symbol: 'ETH', amount: '1', receiver: userAddress() }, signer);
    reload();
  });

  withdraw({
    type: 'floating',
    symbol: 'WETH',
    amount: '0.5',
    shouldApprove: true,
  });
});
