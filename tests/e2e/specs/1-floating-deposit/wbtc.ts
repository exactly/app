import deposit from '../../steps/common/deposit';
import { setupFork } from '../../steps/setup';
import { connectWallet, disconnectWallet } from '../../steps/wallet';

describe('WBTC floating deposit', () => {
  const { visit, setBalance, userAddress } = setupFork();

  before(() => {
    visit('/');
    connectWallet();
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 100,
      WBTC: 100,
    });
  });

  after(() => {
    disconnectWallet();
  });

  deposit({ type: 'floating', symbol: 'WBTC', decimals: 8, balance: '100.0', amount: '1.5', shouldApprove: true });
});
