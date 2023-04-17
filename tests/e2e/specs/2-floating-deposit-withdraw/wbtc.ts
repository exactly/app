import { checkBalance } from '../../steps/actions';
import deposit from '../../steps/common/deposit';
import withdraw, { attemptWithdraw } from '../../steps/common/withdraw';
import { setup } from '../../steps/setup';

describe('WBTC floating deposit/withdraw', () => {
  const { visit, setBalance, userAddress, signer } = setup();

  before(() => {
    visit('/');
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 100,
      WBTC: 5,
    });
  });

  deposit({
    type: 'floating',
    symbol: 'WBTC',
    decimals: 8,
    balance: '5.0',
    amount: '1.5',
    shouldApprove: true,
  });

  describe('Status after deposit', () => {
    checkBalance({ symbol: 'WBTC', amount: '3.5' }, signer);
  });

  attemptWithdraw({ type: 'floating', symbol: 'WBTC', amount: '5' });

  withdraw({
    type: 'floating',
    symbol: 'WBTC',
    amount: '0.5',
  });

  describe('Status after withdraw', () => {
    checkBalance({ symbol: 'WBTC', amount: '4' }, signer);
  });
});
