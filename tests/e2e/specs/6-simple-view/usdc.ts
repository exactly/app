import * as simpleView from '../../steps/simple';
import { getFixedPools, selectFixedPool } from '../../steps/pools';
import { walletConnected } from '../../steps/wallet';
import { setup } from '../../steps/setup';

describe('Test Simple View', () => {
  const { visit, userAddress } = setup({ useDefaultProvider: true });
  const pools = getFixedPools();
  const pool = selectFixedPool();

  before(() => {
    visit('/', { marketView: 'simple', connectWallet: false });
  });

  describe('Simple View: Deposit', () => {
    it('loads the USDC market by default', () => {
      simpleView.tabIsActive('deposit');
      simpleView.checkAssetSelection('USDC');
      simpleView.checkAction('Asset to be deposited');
      simpleView.checkBalanceVisible(false);
    });

    it('displays the connect wallet button until the user connects', () => {
      simpleView.connectUsingView();
      simpleView.waitForViewReady();
      walletConnected(userAddress());
    });

    it('displays the flexible option for deposit', () => {
      simpleView.checkOptionExists(0);
    });

    it('allows to input values', () => {
      simpleView.input('100');
      simpleView.waitForViewReady();
    });
  });

  describe('Simple View: Borrow', () => {
    it('switching tabs to borrow resets the state', () => {
      simpleView.switchTab('borrow');
      simpleView.waitForViewReady();
      simpleView.checkAssetSelection('USDC');
      simpleView.checkAction('Asset to be borrowed');
      simpleView.checkInput('');
    });

    it('displays several options when typing a value', () => {
      simpleView.input('100');
      simpleView.waitForViewReady();
      for (const option of [0, ...pools]) {
        simpleView.checkOptionExists(option);
      }
    });

    it('selecting a flexible pool hides the overview', () => {
      simpleView.selectOption(0);
      simpleView.waitForViewReady();
      simpleView.checkOverviewVisible(false);
    });

    it('selecting a fixed pool displays the overview', () => {
      simpleView.selectOption(pool);
      simpleView.waitForViewReady();
      simpleView.checkOverviewVisible(true);
      simpleView.checkMaturityDate(pool);
    });

    it('should display an alert that we are trying to borrow more than our limit', () => {
      simpleView.checkAlert('error', `You can't borrow more than your borrow limit`);
    });
  });
});
