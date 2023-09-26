import base from '../../fixture/base';
import _balance from '../../common/balance';
import _deposit from '../../common/deposit';
import _withdraw from '../../common/withdraw';
import _app from '../../common/app';
import _dashboard from '../../page/dashboard';
import _navbar from '../../components/navbar';
import { selectFixedPool } from '../../utils/pools';

const test = base();

test.describe.configure({ mode: 'serial' });

test('OP fixed withdraw/deposit', async ({ page, web3, setup }) => {
  const pool = selectFixedPool();

  await web3.fork.setBalance(web3.account.address, {
    ETH: 100,
    OP: 50_000,
  });

  await page.goto('/OP');

  const balance = _balance({ test, page, publicClient: web3.publicClient });
  const deposit = _deposit({ test, page });
  const withdraw = _withdraw({ test, page });
  const app = _app({ test, page });
  const dashboard = _dashboard(page);
  const navbar = _navbar(page);

  await setup.enterMarket('OP');
  await setup.deposit({ symbol: 'OP', amount: '50000', receiver: web3.account.address });
  await setup.borrowAtMaturity({
    symbol: 'OP',
    amount: '5000',
    maturity: BigInt(pool),
    receiver: web3.account.address,
  });

  await app.reload();

  await deposit.execute({
    type: 'fixed',
    symbol: 'OP',
    decimals: 18,
    amount: '2500',
    maturity: pool,
  });

  await balance.check({ address: web3.account.address, symbol: 'OP', amount: '2500' });

  await navbar.goTo('dashboard');

  await dashboard.checkFixedTableRow('deposit', 'OP', pool);

  await withdraw.execute({
    type: 'fixed',
    symbol: 'OP',
    amount: '1000',
    maturity: pool,
  });

  await balance.check({ address: web3.account.address, symbol: 'OP', amount: '3500', delta: '0.005' });
});
