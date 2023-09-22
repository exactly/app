import { expect } from '@playwright/test';

import base from '../../fixture/base';
import _balance from '../../common/balance';
import _dashboard from '../../page/dashboard';
import _app from '../../common/app';
import _rollover from '../../components/rollover';
import { getFixedPools } from '../../utils/pools';

const test = base();

test.describe.configure({ mode: 'serial' });

// FIXME: Skipping until new contract is deployed
test.skip();

test('USDC rollover', async ({ page, web3, setup }) => {
  const pools = getFixedPools();
  if (pools.length < 4) throw new Error('Not enough pools');

  await web3.fork.setBalance(web3.account.address, {
    ETH: 1,
    USDC: 50_000,
  });

  await page.goto('/dashboard');

  const app = _app({ test, page });
  const balance = _balance({ test, page, publicClient: web3.publicClient });
  const dashboard = _dashboard(page);
  const rollover = _rollover(page);

  await setup.enterMarket('USDC');
  await setup.deposit({ symbol: 'USDC', amount: '10000', receiver: web3.account.address });
  await setup.borrow({ symbol: 'USDC', amount: '5000', receiver: web3.account.address });

  await app.reload();

  await test.step('Roll floating debt to fixed', async () => {
    await dashboard.switchTab('borrow');
    await dashboard.checkFloatingTableRow('borrow', 'USDC');

    await expect(rollover.cta('floating', 'OP')).toBeDisabled();
    await expect(rollover.cta('floating', 'USDC')).not.toBeDisabled();

    await rollover.open('floating', 'USDC');

    await rollover.checkOption('from', { type: 'floating' });
    await rollover.checkOption('to', { type: 'empty' });

    await rollover.openSheet('to');
    await rollover.selectDebt('USDC', pools[0]);

    await rollover.checkOption('to', { type: 'fixed', maturity: pools[0] });

    await rollover.waitForModalReady();

    await rollover.submit();

    await rollover.waitForTransaction();
    await rollover.checkTransactionStatus('success', 'Your position has been refinanced');

    await rollover.close();

    await balance.check({ address: web3.account.address, symbol: 'USDC', amount: '45000' });

    await dashboard.checkFixedTableRow('borrow', 'USDC', pools[0]);
  });

  await test.step('Roll fixed debt to another fixed', async () => {
    await dashboard.switchTab('borrow');

    await expect(rollover.cta('floating', 'USDC')).toBeDisabled();
    await expect(rollover.cta('fixed', 'USDC', pools[0])).not.toBeDisabled();

    await rollover.open('fixed', 'USDC', pools[0]);

    await rollover.checkOption('from', { type: 'fixed', maturity: pools[0] });
    await rollover.checkOption('to', { type: 'empty' });

    await rollover.openSheet('to');
    await rollover.selectDebt('USDC', pools[1]);

    await rollover.checkOption('to', { type: 'fixed', maturity: pools[1] });

    await rollover.waitForModalReady();

    await rollover.submit();

    await rollover.waitForTransaction();
    await rollover.checkTransactionStatus('success', 'Your position has been refinanced');

    await rollover.close();

    await balance.check({ address: web3.account.address, symbol: 'USDC', amount: '45000' });

    await dashboard.checkFixedTableRow('borrow', 'USDC', pools[1]);
  });

  await test.step('Roll fixed debt to floating', async () => {
    await dashboard.switchTab('borrow');

    await expect(rollover.cta('floating', 'USDC')).toBeDisabled();
    await expect(rollover.cta('fixed', 'USDC', pools[1])).not.toBeDisabled();

    await rollover.open('fixed', 'USDC', pools[1]);

    await rollover.checkOption('from', { type: 'fixed', maturity: pools[1] });
    await rollover.checkOption('to', { type: 'empty' });

    await rollover.openSheet('to');
    await rollover.selectDebt('USDC');

    await rollover.checkOption('to', { type: 'floating' });

    await rollover.waitForModalReady();

    await rollover.submit();

    await rollover.waitForTransaction();
    await rollover.checkTransactionStatus('success', 'Your position has been refinanced');

    await rollover.close();

    await balance.check({ address: web3.account.address, symbol: 'USDC', amount: '45000' });

    await dashboard.checkFloatingTableRow('borrow', 'USDC');
  });

  await page.waitForTimeout(600_000);
});
