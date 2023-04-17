import * as navbar from '../../steps/navbar';
import * as dashboard from '../../steps/dashboard';
import { enterMarket, deposit, reload, borrowAtMaturity, checkBalance } from '../../steps/actions';
import { selectFixedPool } from '../../steps/pools';
import { setup } from '../../steps/setup';
import depositAtMaturity from '../../steps/common/deposit';
import withdrawAtMaturity from '../../steps/common/withdraw';

describe('WBTC fixed withdraw/deposit', () => {
  const { visit, setBalance, userAddress, signer } = setup();
  const pool = selectFixedPool();

  before(() => {
    visit('/WBTC');
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 100,
      WBTC: 500,
    });
  });

  describe('Setup environment for successful fixed deposit', () => {
    enterMarket('WBTC', signer);
    deposit({ symbol: 'WBTC', amount: '400', receiver: userAddress() }, signer);
    borrowAtMaturity({ symbol: 'WBTC', amount: '5', maturity: pool, receiver: userAddress() }, signer);

    reload();
  });

  depositAtMaturity({
    type: 'fixed',
    symbol: 'WBTC',
    decimals: 8,
    amount: '10',
    maxYield: '50',
    balance: '105',
    maturity: pool,
  });

  describe('Status after fixed deposit', () => {
    checkBalance({ symbol: 'WBTC', amount: '95' }, signer);

    it('should navigate to the dashboard', () => {
      navbar.goTo('dashboard');
    });

    it('should have a fixed deposit for WBTC', () => {
      dashboard.checkFixedTableRow('deposit', 'WBTC', pool);
    });
  });

  withdrawAtMaturity({
    type: 'fixed',
    symbol: 'WBTC',
    amount: '5',
    maturity: pool,
  });

  describe('Status after fixed withdraw', () => {
    checkBalance({ symbol: 'WBTC', amount: '100', approx: 0.005 }, signer);
  });
});
