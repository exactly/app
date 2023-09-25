import base from '../../fixture/base';
import _balance from '../../common/balance';
import _allowance from '../../common/allowance';
import _app from '../../common/app';
import _leverage from '../../components/leverage';

import { debtManager } from '../../utils/contracts';

const test = base();

test.describe.configure({ mode: 'serial' });

// FIXME: Skipping until new contract is deployed
test.skip();

test('USDC leverage', async ({ page, web3, setup }) => {
  await web3.fork.setBalance(web3.account.address, {
    ETH: 1,
    USDC: 50_000,
  });

  await page.goto('/dashboard');

  const app = _app({ test, page });
  const balance = _balance({ test, page, publicClient: web3.publicClient });
  const allowance = _allowance({ test, page, publicClient: web3.publicClient });
  const leverage = _leverage(page);

  const spender = await debtManager();

  await setup.enterMarket('USDC');
  await setup.deposit({ symbol: 'USDC', amount: '10000', receiver: web3.account.address });

  await app.reload();

  await page.goto('/strategies');

  await test.step('Leverage USDC (no deposit)', async () => {
    await leverage.open();

    await leverage.checkOption('from', { type: 'empty' });
    await leverage.checkOption('to', { type: 'empty' });

    await leverage.selectAsset('from', 'USDC');
    await leverage.checkOption('to', { type: 'selected', symbol: 'USDC' });

    await leverage.checkCurrentMultiplier(/1\.00x$/);

    await leverage.selectMultiplier({ type: 'max' });

    await leverage.waitForStepToContinue();
    await leverage.goToSummary();

    await leverage.acceptRisk();
    await leverage.waitSummaryToBeReady();

    await leverage.submit();

    await leverage.waitForTransaction();
    await leverage.checkTransactionStatus('success', 'Your position has been leveraged');

    await leverage.close();

    await balance.check({ address: web3.account.address, symbol: 'USDC', amount: '40000' });

    await allowance.check({
      address: web3.account.address,
      type: 'erc20',
      symbol: 'USDC',
      less: '0',
      spender: spender.address,
    });

    await allowance.check({
      address: web3.account.address,
      type: 'market',
      symbol: 'USDC',
      less: '10',
      spender: spender.address,
    });
  });

  await test.step('Deleverage USDC', async () => {
    await leverage.open();

    await leverage.checkOption('from', { type: 'empty' });
    await leverage.checkOption('to', { type: 'empty' });

    await leverage.selectAsset('from', 'USDC');
    await leverage.checkOption('to', { type: 'selected', symbol: 'USDC' });

    await leverage.checkCurrentMultiplier(/5\.32x$/);

    await leverage.selectMultiplier({ type: 'min' });

    await leverage.waitForStepToContinue();
    await leverage.goToSummary();

    await leverage.acceptRisk();
    await leverage.waitSummaryToBeReady();

    await leverage.submit();

    await leverage.waitForTransaction();
    await leverage.checkTransactionStatus('success', 'Your position has been deleveraged');

    await leverage.close();

    await balance.check({ address: web3.account.address, symbol: 'USDC', amount: '40000' });

    await allowance.check({
      address: web3.account.address,
      type: 'market',
      symbol: 'USDC',
      less: '10',
      spender: spender.address,
    });
  });

  await test.step('Leverage USDC (with deposit)', async () => {
    await leverage.open();

    await leverage.checkOption('from', { type: 'empty' });
    await leverage.checkOption('to', { type: 'empty' });

    await leverage.selectAsset('from', 'USDC');
    await leverage.checkOption('to', { type: 'selected', symbol: 'USDC' });

    await leverage.checkCurrentMultiplier(/1\.00x$/);

    await leverage.selectMultiplier({ type: 'max' });

    await leverage.openMoreOptions();
    await leverage.input('5000');

    await leverage.waitForStepToContinue();
    await leverage.goToSummary();

    await leverage.acceptRisk();
    await leverage.waitSummaryToBeReady();

    await leverage.submit();

    await leverage.waitForTransaction();
    await leverage.checkTransactionStatus('success', 'Your position has been leveraged');

    await leverage.close();

    await balance.check({ address: web3.account.address, symbol: 'USDC', amount: '35000' });

    await allowance.check({
      address: web3.account.address,
      type: 'erc20',
      symbol: 'USDC',
      less: '0',
      spender: spender.address,
    });

    await allowance.check({
      address: web3.account.address,
      type: 'market',
      symbol: 'USDC',
      less: '10',
      spender: spender.address,
    });
  });
});
