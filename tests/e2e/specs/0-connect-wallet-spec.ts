import { setup } from '../steps/setup';
import { connectWallet, walletConnected } from '../steps/wallet';

describe('Test Connect Wallet', () => {
  const { visit, userAddress } = setup({ useDefaultProvider: true });

  before(() => {
    visit('/', { connectWallet: false });
  });

  it('Connects with injected connector', () => {
    connectWallet();

    walletConnected(userAddress());
  });
});
