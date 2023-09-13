// import { enterMarket, exitMarket } from '../steps/common/market';

import base from '../../fixture/base';

const test = base();

test.describe('WETH enter/exit market', () => {
  test('Should enter market', async ({ page, web3 }) => {
    await page.goto('/dashboard');

    await web3.fork.setBalance(web3.account.address, {
      ETH: 1,
    });

    await new Promise((r) => setTimeout(r, 600_000));
  });
});
