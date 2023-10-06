import base, { chain } from '../../fixture/base';
import _app from '../../common/app';
import _balance from '../../common/balance';
import _allowance from '../../common/allowance';
import _getEXA from '../../page/getEXA';
import { erc20, swapper } from '../../utils/contracts';

const test = base();

test.describe.configure({ mode: 'serial' });

test('Get EXA on same chain', async ({ page, web2, web3 }) => {
  await web3.fork.setBalance(web3.account.address, {
    ETH: 1,
    OP: 100,
  });

  const exa = await erc20('EXA', { walletClient: web3.walletClient, publicClient: web3.publicClient });
  const swap = await swapper();

  const app = _app({ test, page });
  const balance = _balance({ test, page, publicClient: web3.publicClient });
  const allowance = _allowance({ test, page, publicClient: web3.publicClient });
  const getEXA = _getEXA(page);

  await web2.socket.balances({
    account: web3.account.address,
    balances: [
      { symbol: 'OP', amount: 100 },
      { symbol: 'ETH', amount: 1 },
    ],
  });

  await page.goto('/get-exa');
  await getEXA.waitForPageToBeReady();

  await test.step('Swap ETH for EXA', async () => {
    await getEXA.checkView('route');
    await getEXA.checkNetwork('Optimism');

    await getEXA.selectAsset('ETH');

    await getEXA.checkBalanceAvailable(/1\.00/);

    await getEXA.input('1000');
    await getEXA.checkDisabledSubmitLabel('Insufficient ETH balance');

    await getEXA.input('0.01');

    await getEXA.submit();

    await getEXA.checkView('tx-status');
    await getEXA.waitForSubmitTransaction();

    await getEXA.checkTransactionStatus('success');

    await balance.exists({ address: web3.account.address, symbol: 'EXA' });
  });

  const balanceOf = await exa.read.balanceOf([web3.account.address]);
  await exa.write.transfer(['0x0000000000000000000000000000000000000002', balanceOf], { account: web3.account, chain });

  await app.reload();
  await getEXA.waitForPageToBeReady();

  await test.step('Swap OP for EXA', async () => {
    await getEXA.checkView('route');
    await getEXA.checkNetwork('Optimism');

    await getEXA.selectAsset('OP');

    await getEXA.checkBalanceAvailable(/100\.00/);

    await getEXA.input('10');

    await getEXA.checkRouteVisible();

    await getEXA.review();
    await getEXA.checkView('review');

    await getEXA.approve();
    await getEXA.waitForApproveTransaction();

    await getEXA.submit();

    await getEXA.checkView('tx-status');
    await getEXA.waitForSubmitTransaction();

    await getEXA.checkTransactionStatus('success');

    await balance.exists({ address: web3.account.address, symbol: 'EXA' });

    await balance.check({ address: web3.account.address, symbol: 'OP', amount: '90' });
    await allowance.check({
      address: web3.account.address,
      type: 'erc20',
      symbol: 'OP',
      spender: swap.address,
      less: '0',
    });
  });
});
