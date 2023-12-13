import base from '../../fixture/base';
import _deposit from '../../common/deposit';
import _withdraw from '../../common/withdraw';
import _balance from '../../common/balance';

const test = base();

test.describe.configure({ mode: 'serial' });

test('USDC floating deposit/withdraw', async ({ page, web3 }) => {
  await web3.fork.setBalance(web3.account.address, {
    ETH: 1,
    USDC: 5,
  });

  await page.goto('/USDC');

  const deposit = _deposit({ test, page });
  const withdraw = _withdraw({ test, page });
  const balance = _balance({ test, page, publicClient: web3.publicClient });

  await deposit.execute({
    type: 'floating',
    symbol: 'USDC',
    decimals: 6,
    balance: '5.0',
    amount: '1.5',
    shouldApprove: true,
  });

  await balance.check({ address: web3.account.address, symbol: 'USDC', amount: '3.5' });

  await withdraw.attempt({ type: 'floating', symbol: 'USDC', amount: '5' });

  await withdraw.execute({
    type: 'floating',
    symbol: 'USDC',
    amount: '0.5',
  });

  await balance.check({ address: web3.account.address, symbol: 'USDC', amount: '4' });
});
