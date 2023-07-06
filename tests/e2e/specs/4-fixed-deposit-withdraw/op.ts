import * as navbar from '../../steps/navbar';
import * as dashboard from '../../steps/dashboard';
import { enterMarket, deposit, reload, borrowAtMaturity, checkBalance } from '../../steps/actions';
import { selectFixedPool } from '../../steps/pools';
import { setup } from '../../steps/setup';
import depositAtMaturity from '../../steps/common/deposit';
import withdrawAtMaturity from '../../steps/common/withdraw';

describe('OP fixed withdraw/deposit', () => {
  const { visit, setBalance, userAddress, walletClient, publicClient } = setup();
  const pool = selectFixedPool();

  before(() => {
    visit('/OP');
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 100,
      OP: 50_000,
    });
  });

  describe('Setup environment for successful fixed deposit', () => {
    enterMarket('OP', walletClient);
    deposit({ symbol: 'OP', amount: '50000', receiver: userAddress() }, walletClient, publicClient);
    borrowAtMaturity(
      { symbol: 'OP', amount: '5000', maturity: BigInt(pool), receiver: userAddress() },
      walletClient,
      publicClient,
    );

    reload();
  });

  depositAtMaturity({
    type: 'fixed',
    symbol: 'OP',
    decimals: 18,
    amount: '2500',
    maturity: pool,
  });

  describe('Status after fixed deposit', () => {
    checkBalance({ address: userAddress(), symbol: 'OP', amount: '2500' }, publicClient);

    it('should navigate to the dashboard', () => {
      navbar.goTo('dashboard');
    });

    it('should have a fixed deposit for WBTC', () => {
      dashboard.checkFixedTableRow('deposit', 'OP', pool);
    });
  });

  withdrawAtMaturity({
    type: 'fixed',
    symbol: 'OP',
    amount: '1000',
    maturity: pool,
  });

  describe('Status after fixed withdraw', () => {
    checkBalance({ address: userAddress(), symbol: 'OP', amount: '3500', delta: 0.005 }, publicClient);
  });
});
