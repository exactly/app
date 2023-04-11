import * as navbar from '../../steps/navbar';
import * as dashboard from '../../steps/dashboard';
import { borrow, deposit, enterMarket, reload } from '../../steps/actions';
import repay from '../../steps/common/repay';
import { setupFork } from '../../steps/setup';

describe('WETH floating repay', () => {
  const { visit, setBalance, userAddress, signer } = setupFork();

  before(() => {
    visit('/').then(() => {
      navbar.goTo('dashboard');
      dashboard.switchTab('borrow');
    });
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 100,
    });
  });

  describe('Setup environment for a successful repay', () => {
    enterMarket('WETH', signer);
    deposit({ symbol: 'ETH', amount: '1', receiver: userAddress() }, signer);
    borrow({ symbol: 'ETH', amount: '0.5', receiver: userAddress() }, signer);

    reload();

    it('switches to borrows tab', () => {
      dashboard.switchTab('borrow');
    });
  });

  repay({
    type: 'floating',
    symbol: 'WETH',
    amount: '0.25',
    balance: '100',
  });
});
