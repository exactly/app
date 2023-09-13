import base from '../../fixture/base';
import _balance from '../../common/balance';
import _navbar from '../../components/navbar';
import _dashboard from '../../page/dashboard';
import _borrow from '../../common/borrow';
import _repay from '../../common/repay';
import _app from '../../common/app';
import { selectFixedPool } from '../../utils/pools';

const test = base();

test.describe.configure({ mode: 'serial' });

test('OP fixed borrow/repay', async ({ page, web3, setup }) => {
  const pool = selectFixedPool();

  await web3.fork.setBalance(web3.account.address, {
    ETH: 200,
    OP: 250,
  });

  await page.goto('/OP');

  const balance = _balance({ test, page, publicClient: web3.publicClient });
  const borrow = _borrow({ test, page });
  const repay = _repay({ test, page });
  const app = _app({ test, page });
  const navbar = _navbar(page);
  const dashboard = _dashboard(page);

  await setup.enterMarket('OP');
  await setup.deposit({ symbol: 'OP', amount: '200', receiver: web3.account.address });

  await app.reload();

  await borrow.execute({
    type: 'fixed',
    symbol: 'OP',
    amount: '5',
    maturity: pool,
  });

  await balance.check({ address: web3.account.address, symbol: 'OP', amount: '55' });

  await navbar.goTo('dashboard');
  await dashboard.switchTab('borrow');

  await dashboard.checkFixedTableRow('borrow', 'OP', pool);

  await repay.execute({
    type: 'fixed',
    symbol: 'OP',
    amount: '3',
    maturity: pool,
  });

  await balance.check({ address: web3.account.address, symbol: 'OP', amount: '52', delta: 0.005 });
});
