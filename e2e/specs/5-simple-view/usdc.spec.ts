import base from '../../fixture/base';
import _simple from '../../page/simple';
import _wallet from '../../components/wallet';
import { selectFixedPool, getFixedPools } from '../../utils/pools';

const test = base({ options: { marketView: 'simple' } });

test.describe.configure({ mode: 'serial' });

test('Test Simple View', async ({ page, web3 }) => {
  const pools = getFixedPools();
  const pool = selectFixedPool();

  await page.goto('/');

  const simple = _simple(page);
  const wallet = _wallet(page);

  await test.step('App is connected to correct wallet', async () => {
    await wallet.connectedWallet(web3.account.address);
  });

  await test.step('Simple View: Deposit', async () => {
    await simple.waitForViewReady();

    await test.step('loads the USDC market by default', async () => {
      await simple.tabIsActive('deposit');
      await simple.checkAssetSelection('USDC');
      await simple.checkAction('Asset to be deposited');
    });

    await test.step('displays the flexible option for deposit', async () => {
      await simple.checkOptionExists(0);
    });

    await test.step('allows to input values', async () => {
      await simple.input('100');
      await simple.waitForViewReady();
    });
  });

  await test.step('Simple View: Borrow', async () => {
    await test.step('switching tabs to borrow resets the state', async () => {
      await simple.switchTab('borrow');
      await simple.waitForViewReady();
      await simple.checkAssetSelection('USDC');
      await simple.checkAction('Asset to be borrowed');
      await simple.checkInput('');
    });

    await test.step('displays several options when typing a value', async () => {
      await simple.input('100');
      await simple.waitForViewReady();
      for (const option of [0, ...pools]) {
        await simple.checkOptionExists(option);
      }
    });

    await test.step('selecting a flexible pool hides the overview', async () => {
      await simple.selectOption(0);
      await simple.waitForViewReady();
      await simple.checkOverviewVisible(false);
    });

    await test.step('selecting a fixed pool displays the overview', async () => {
      await simple.selectOption(pool);
      await simple.waitForViewReady();
      await simple.checkOverviewVisible(true);
      await simple.checkMaturityDate(pool);
    });

    await test.step('should display an alert that we are trying to borrow more than our limit', async () => {
      await simple.checkAlert('error', `You can't borrow more than your borrow limit`);
    });
  });
});
