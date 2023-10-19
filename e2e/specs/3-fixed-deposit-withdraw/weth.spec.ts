import base from '../../fixture/base';
import _deposit from '../../common/deposit';
import _withdraw from '../../common/withdraw';
import _app from '../../common/app';
import _dashboard from '../../page/dashboard';
import _navbar from '../../components/navbar';
import { selectFixedPool } from '../../utils/pools';

const test = base();

test.describe.configure({ mode: 'serial' });

test('WETH fixed withdraw/deposit', async ({ page, web3, setup }) => {
  const pool = selectFixedPool();

  await web3.fork.setBalance(web3.account.address, {
    ETH: 200,
  });

  await page.goto('/WETH');

  const deposit = _deposit({ test, page });
  const withdraw = _withdraw({ test, page });
  const app = _app({ test, page });
  const navbar = _navbar(page);
  const dashboard = _dashboard(page);

  await setup.enterMarket('WETH');
  await setup.deposit({ symbol: 'ETH', amount: '50', receiver: web3.account.address });
  await setup.borrowAtMaturity({ symbol: 'ETH', amount: '25', maturity: BigInt(pool), receiver: web3.account.address });

  await app.reload();

  await deposit.execute({
    type: 'fixed',
    symbol: 'WETH',
    decimals: 18,
    amount: '2',
    balance: '175',
    maturity: pool,
  });

  await navbar.goTo('dashboard');

  await dashboard.checkFixedTableRow('deposit', 'WETH', pool);

  await withdraw.execute({
    type: 'fixed',
    symbol: 'WETH',
    amount: '1',
    maturity: pool,
  });
});
