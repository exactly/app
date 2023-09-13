import base from '../../fixture/base';
import _market from '../../common/market';

const test = base();

test.describe.configure({ mode: 'serial' });

test('WETH enter/exit market', async ({ page, web3 }) => {
  await web3.fork.setBalance(web3.account.address, {
    ETH: 1,
  });

  await page.goto('/dashboard');

  const market = _market({ test, page });

  await market.enterMarket({ symbol: 'WETH' });
  await market.exitMarket({ symbol: 'WETH' });
});
