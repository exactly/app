import base from '../../fixture/base';
import _deposit from '../../common/deposit';
import _withdraw from '../../common/withdraw';

const test = base();

test.describe.configure({ mode: 'serial' });

test('WETH floating deposit/withdraw', async ({ page, web3 }) => {
  await web3.fork.setBalance(web3.account.address, {
    ETH: 100,
  });

  await page.goto('/');

  const deposit = _deposit({ test, page });
  const withdraw = _withdraw({ test, page });

  await deposit.execute({
    type: 'floating',
    symbol: 'WETH',
    decimals: 18,
    balance: '100',
    amount: '1',
  });

  await withdraw.attempt({ type: 'floating', symbol: 'WETH', amount: '10' });

  await withdraw.execute({
    type: 'floating',
    symbol: 'WETH',
    amount: '0.5',
    shouldApprove: true,
  });
});
