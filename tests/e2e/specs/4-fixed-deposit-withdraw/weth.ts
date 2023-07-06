import * as navbar from '../../steps/navbar';
import * as dashboard from '../../steps/dashboard';
import { enterMarket, deposit, reload, borrowAtMaturity } from '../../steps/actions';
import { selectFixedPool } from '../../steps/pools';
import { setup } from '../../steps/setup';
import depositAtMaturity from '../../steps/common/deposit';
import withdrawAtMaturity from '../../steps/common/withdraw';

describe('WETH fixed withdraw/deposit', () => {
  const { visit, setBalance, userAddress, walletClient, publicClient } = setup();
  const pool = selectFixedPool();

  before(() => {
    visit('/WETH');
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 200,
    });
  });

  describe('Setup environment for successful fixed deposit', () => {
    enterMarket('WETH', walletClient);
    deposit({ symbol: 'ETH', amount: '50', receiver: userAddress() }, walletClient, publicClient);
    borrowAtMaturity(
      { symbol: 'ETH', amount: '25', maturity: BigInt(pool), receiver: userAddress() },
      walletClient,
      publicClient,
    );

    reload();
  });

  depositAtMaturity({
    type: 'fixed',
    symbol: 'WETH',
    decimals: 18,
    amount: '2',
    balance: '174',
    maturity: pool,
  });

  describe('Status after fixed deposit', () => {
    it('should navigate to the dashboard', () => {
      navbar.goTo('dashboard');
    });

    it('should have a fixed deposit for WETH', () => {
      dashboard.checkFixedTableRow('deposit', 'WETH', pool);
    });
  });

  withdrawAtMaturity({
    type: 'fixed',
    symbol: 'WETH',
    amount: '1',
    maturity: pool,
  });
});
