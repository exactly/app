import base from '../../fixture/base';
import _simple from '../../page/simple';
import _account from '../../components/wallet';
import { selectFixedPool, getFixedPools } from '../../utils/pools';

const test = base();

test.use({ options: { marketView: 'simple' } });

test('Test Simple View', async ({ page, web3 }) => {
  const pools = getFixedPools();
  const pool = selectFixedPool();

  await page.goto('/');

  const simple = _simple(page);
  const account = _account(page);

  await test.step('assert: account connected', async () => {
    await account.connectedWallet(web3.account.address);
  });

  await test.step('flow: simple deposit USDC', async () => {
    await simple.waitForViewReady();

    await test.step('simple: default deposit market USDC', async () => {
      await simple.tabIsActive('deposit');
      await simple.checkAssetSelection('USDC');
      await simple.checkAction('Asset to be deposited');
    });

    await test.step('simple: deposit flexible option', async () => {
      await simple.checkOptionExists(0);
    });

    await test.step('input: simple deposit amount', async () => {
      await simple.input('100');
      await simple.waitForViewReady();
    });
  });

  await test.step('flow: simple borrow USDC', async () => {
    await test.step('simple: switch to borrow resets state', async () => {
      await simple.switchTab('borrow');
      await simple.waitForViewReady();
      await simple.checkAssetSelection('USDC');
      await simple.checkAction('Asset to be borrowed');
      await simple.checkInput('');
    });

    await test.step('input: simple borrow amount', async () => {
      await simple.input('100');
      await simple.waitForViewReady();
      for (const option of [0, ...pools]) {
        await simple.checkOptionExists(option);
      }
    });

    await test.step('simple: select flexible borrow pool', async () => {
      await simple.selectOption(0);
      await simple.waitForViewReady();
      await simple.checkOverviewVisible(false);
    });

    await test.step('simple: select fixed borrow pool', async () => {
      await simple.selectOption(pool);
      await simple.waitForViewReady();
      await simple.checkOverviewVisible(true);
      await simple.checkMaturityDate(pool);
    });

    await test.step('assert: simple borrow limit alert', async () => {
      await simple.checkAlert('error', `You can't borrow more than your borrow limit`);
    });
  });
});
