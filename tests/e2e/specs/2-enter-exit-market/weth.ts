import * as navbar from '../../steps/navbar';
import { enterMarket, exitMarket } from '../../steps/common/market';
import { setupFork } from '../../steps/setup';
import { disconnectWallet } from '../../steps/wallet';

describe('WETH enter/exit market', () => {
  const { visit, setBalance, userAddress } = setupFork();

  before(() => {
    visit('/').then(() => navbar.goTo('dashboard'));
  });

  before(async () => {
    await setBalance(userAddress(), {
      ETH: 100,
    });
  });

  after(() => {
    disconnectWallet();
  });

  enterMarket({ symbol: 'WETH' });

  exitMarket({ symbol: 'WETH' });
});