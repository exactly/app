import base from '../../fixture/base';
import _navbar from '../../components/navbar';
import _dashboard from '../../page/dashboard';
import _borrow from '../../common/borrow';
import _repay from '../../common/repay';
import _app from '../../common/app';
import { selectFixedPool } from '../../utils/pools';

const test = base();

test.describe.configure({ mode: 'serial' });

test('WETH fixed borrow/repay', async ({ page, web3, setup }) => {
  const pool = selectFixedPool();

  await web3.fork.setBalance(web3.account.address, {
    ETH: 200,
  });

  await page.goto('/WETH');

  const borrow = _borrow({ test, page });
  const repay = _repay({ test, page });
  const app = _app({ test, page });
  const navbar = _navbar(page);
  const dashboard = _dashboard(page);

  await setup.enterMarket('WETH');
  await setup.deposit({ symbol: 'ETH', amount: '100', receiver: web3.account.address });

  await app.reload();

  await borrow.execute({
    type: 'fixed',
    symbol: 'WETH',
    amount: '5',
    maturity: pool,
    shouldApprove: true,
  });

  await navbar.goTo('dashboard');

  await dashboard.switchTab('borrow');
  await dashboard.checkFixedTableRow('borrow', 'WETH', pool);

  await repay.execute({
    type: 'fixed',
    symbol: 'WETH',
    amount: '2.5',
    maturity: pool,
  });
});
