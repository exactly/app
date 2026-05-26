import base from '../../fixture/base';
import _market from '../../common/market';

const test = base();

test('WETH enter/exit market', async ({ page, web3, setup }) => {
  await web3.anvil.setBalance(web3.account.address, {
    ETH: 2,
  });
  await setup.deposit({ symbol: 'ETH', amount: '1', receiver: web3.account.address });

  await page.goto('/dashboard');

  const market = _market({ test, page });

  await market.enterMarket({ symbol: 'WETH' });
  await market.exitMarket({ symbol: 'WETH' });
});
