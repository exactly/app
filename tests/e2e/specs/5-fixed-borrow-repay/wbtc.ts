import * as navbar from '../../steps/navbar';
import * as dashboard from '../../steps/dashboard';
import { checkBalance, deposit, enterMarket, reload } from '../../steps/actions';
import { selectFixedPool } from '../../steps/pools';
import { setup } from '../../steps/setup';
import borrowAtMaturity from '../../steps/common/borrow';
import repayAtMaturity from '../../steps/common/repay';

describe('WBTC fixed borrow/repay', () => {
  const { visit, setBalance, userAddress, walletClient, publicClient } = setup();
  const pool = selectFixedPool();

  before(() => {
    visit('/WBTC');
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 200,
      WBTC: 250,
    });
  });

  describe('Setup environment for a successful fixed borrow', () => {
    enterMarket('WBTC', walletClient);
    deposit({ symbol: 'WBTC', amount: '200', receiver: userAddress() }, walletClient, publicClient);

    reload();
  });

  borrowAtMaturity({
    type: 'fixed',
    symbol: 'WBTC',
    amount: '5',
    maturity: pool,
  });

  describe('Status after fixed borrow', () => {
    checkBalance({ address: userAddress(), symbol: 'WBTC', amount: '55' }, publicClient);

    it('should navigate to the dashboard', () => {
      navbar.goTo('dashboard');
      dashboard.switchTab('borrow');
    });

    it('should have a fixed borrow for WBTC', () => {
      dashboard.checkFixedTableRow('borrow', 'WBTC', pool);
    });
  });

  repayAtMaturity({
    type: 'fixed',
    symbol: 'WBTC',
    amount: '3',
    maturity: pool,
  });

  describe('Status after fixed repay', () => {
    checkBalance({ address: userAddress(), symbol: 'WBTC', amount: '52', delta: 0.005 }, publicClient);
  });
});
