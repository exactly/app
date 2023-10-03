import { expect } from '@playwright/test';
import { parseEther } from 'viem';

import base from '../../fixture/base';
import _app from '../../common/app';
import { escrowedEXA, sablierV2LockupLinear } from '../../utils/contracts';

const test = base();

test.describe.configure({ mode: 'serial' });

test('Vesting esEXA', async ({ page, web2, web3 }) => {
  await web3.fork.setBalance(web3.account.address, {
    esEXA: 100,
    EXA: 10,
  });

  const app = _app({ test, page });
  const esEXA = await escrowedEXA({ publicClient: web3.publicClient });
  const sablier = await sablierV2LockupLinear({ publicClient: web3.publicClient });
  const stream = await sablier.read.nextStreamId();

  await page.goto('/vesting');

  await test.step('Vest esEXA', async () => {
    // FIXME: Add test
    await page.waitForTimeout(15_000);
  });

  const now = Date.now() / 1_000;
  const period = await esEXA.read.vestingPeriod();

  await web2.time.now(now + period / 2);
  await web3.fork.increaseTime(now + period / 2);

  await web2.graph.streams([
    {
      id: `0xb923abdca17aed90eb5ec5e407bd37164f632bfd-10-${stream}`,
      tokenId: String(stream),
      recipient: web3.account.address,
      startTime: String(now),
      endTime: String(now + period),
      depositAmount: String(parseEther('100')),
      withdrawnAmount: '0',
      canceled: false,
    },
  ]);

  await app.reload();

  await test.step('Withdraw EXA half-way', async () => {
    // FIXME: Add test
    await page.waitForTimeout(15_000);
  });

  await web2.time.now(now + period * 2);
  await web3.fork.increaseTime(now + period * 2);

  await web2.graph.streams([
    {
      id: `0xb923abdca17aed90eb5ec5e407bd37164f632bfd-10-${stream}`,
      tokenId: String(stream),
      recipient: web3.account.address,
      startTime: String(now),
      endTime: String(now + period),
      depositAmount: String(parseEther('100')),
      withdrawnAmount: String(parseEther('50')),
      canceled: false,
    },
  ]);

  await app.reload();

  await test.step('Withdraw EXA from depleted stream', async () => {
    // FIXME: Add test
    await page.waitForTimeout(15_000);
  });
});
