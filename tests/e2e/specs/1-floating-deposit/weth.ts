import deposit from '../../steps/common/deposit';
import { setupFork } from '../../steps/setup';

describe('WETH floating deposit', () => {
  const { visit, setBalance, userAddress } = setupFork();

  before(() => {
    visit('/');
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 100,
    });
  });

  deposit({ type: 'floating', symbol: 'ETH', decimals: 18, balance: '100.0', amount: '10' });
});
