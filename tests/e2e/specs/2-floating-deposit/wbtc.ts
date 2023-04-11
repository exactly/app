import deposit from '../../steps/common/deposit';
import { setupFork } from '../../steps/setup';

describe('WBTC floating deposit', () => {
  const { visit, setBalance, userAddress } = setupFork();

  before(() => {
    visit('/');
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 100,
      WBTC: 100,
    });
  });

  deposit({ type: 'floating', symbol: 'WBTC', decimals: 8, balance: '100.0', amount: '1.5', shouldApprove: true });
});
