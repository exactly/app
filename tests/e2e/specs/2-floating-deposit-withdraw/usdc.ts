import { checkBalance } from '../../steps/actions';
import deposit from '../../steps/common/deposit';
import withdraw, { attemptWithdraw } from '../../steps/common/withdraw';
import { setup } from '../../steps/setup';

describe('USDC floating deposit/withdraw', () => {
  const { visit, setBalance, userAddress, publicClient } = setup();

  before(() => {
    visit('/');
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 100,
      USDC: 5,
    });
  });

  deposit({
    type: 'floating',
    symbol: 'USDC',
    decimals: 6,
    balance: '5.0',
    amount: '1.5',
    shouldApprove: true,
  });

  describe('Status after deposit', () => {
    checkBalance({ address: userAddress(), symbol: 'USDC', amount: '3.5' }, publicClient);
  });

  attemptWithdraw({ type: 'floating', symbol: 'USDC', amount: '5' });

  withdraw({
    type: 'floating',
    symbol: 'USDC',
    amount: '0.5',
  });

  describe('Status after withdraw', () => {
    checkBalance({ address: userAddress(), symbol: 'USDC', amount: '4' }, publicClient);
  });
});
