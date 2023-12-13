import base from '../../fixture/base';
import _borrow from '../../common/borrow';
import _repay from '../../common/repay';
import _app from '../../common/app';

const test = base();

test.describe.configure({ mode: 'serial' });

test('WETH floating borrow/repay', async ({ page, web3, setup }) => {
  await web3.fork.setBalance(web3.account.address, {
    ETH: 100,
  });

  await page.goto('/WETH');

  const borrow = _borrow({ test, page });
  const repay = _repay({ test, page });
  const app = _app({ test, page });

  await borrow.attempt({ type: 'floating', symbol: 'WETH', amount: '1' });

  await setup.enterMarket('WETH');
  await setup.deposit({ symbol: 'ETH', amount: '1', receiver: web3.account.address });
  await app.reload();

  await borrow.execute({
    type: 'floating',
    symbol: 'WETH',
    amount: '0.5',
    aboveLimitAmount: 10,
    aboveLiquidityAmount: 10_000_000,
    shouldApprove: true,
  });

  await repay.execute({
    type: 'floating',
    symbol: 'WETH',
    amount: '0.25',
  });
});
