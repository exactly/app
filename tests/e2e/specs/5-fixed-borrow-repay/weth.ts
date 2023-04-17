import * as navbar from '../../steps/navbar';
import * as dashboard from '../../steps/dashboard';
import { deposit, enterMarket, reload } from '../../steps/actions';
import { selectFixedPool } from '../../steps/pools';
import { setup } from '../../steps/setup';
import borrowAtMaturity from '../../steps/common/borrow';
import repayAtMaturity from '../../steps/common/repay';

describe('WETH fixed borrow/repay', () => {
  const { visit, setBalance, userAddress, signer } = setup();
  const pool = selectFixedPool();

  before(() => {
    visit('/WETH');
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 200,
    });
  });

  describe('Setup environment for a successful fixed borrow', () => {
    enterMarket('WETH', signer);
    deposit({ symbol: 'ETH', amount: '100', receiver: userAddress() }, signer);

    reload();
  });

  borrowAtMaturity({
    type: 'fixed',
    symbol: 'WETH',
    amount: '5',
    maturity: pool,
    shouldApprove: true,
  });

  describe('Status after fixed borrow', () => {
    it('should navigate to the dashboard', () => {
      navbar.goTo('dashboard');
      dashboard.switchTab('borrow');
    });

    it('should have a fixed borrow for WETH', () => {
      dashboard.checkFixedTableRow('borrow', 'WETH', pool);
    });
  });

  repayAtMaturity({
    type: 'fixed',
    symbol: 'WETH',
    amount: '2.5',
    maturity: pool,
  });
});
