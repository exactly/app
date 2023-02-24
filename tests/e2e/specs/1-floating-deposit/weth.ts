import deposit from '../../steps/common/deposit';
import { setupFork } from '../../steps/setup';
import { connectWallet, disconnectWallet } from '../../steps/wallet';

describe('WETH floating deposit', () => {
  const { visit, setBalance, userAddress } = setupFork();

  before(() => {
    visit('/');
    connectWallet();
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 100,
    });
  });

  after(() => {
    disconnectWallet();
  });

  deposit({ type: 'floating', symbol: 'ETH', decimals: 18, balance: '100.0', amount: '10' });
});
