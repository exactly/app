import { expect } from '@playwright/test';

import base from '../../fixture/base';
import _app from '../../common/app';
import _balance from '../../common/balance';
import _staking from '../../page/staking';
import { erc20Market } from '../../utils/contracts';

const test = base();

test('stake EXA refreshes balances without reload', async ({ page, web3 }) => {
  await web3.anvil.setBalance(web3.account.address, { ETH: 1, EXA: 100 });
  const balance = _balance({ test, page, publicClient: web3.publicClient });
  const staking = _staking(page);

  await page.goto('/staking');
  await staking.waitForReady();
  await expect(staking.available()).toContainText('100.00');
  await expect(staking.staked()).toHaveText('0.00');

  await staking.stake('50');
  await staking.closeTransaction();

  await balance.check({ address: web3.account.address, symbol: 'EXA', amount: '50' });
  await expect(staking.available()).toContainText('50.00');
  await expect(staking.staked()).toHaveText('50.00');
});

test('withdraw staked EXA refreshes balances without reload', async ({ page, web3 }) => {
  await web3.anvil.setBalance(web3.account.address, { ETH: 1, EXA: 100 });
  const balance = _balance({ test, page, publicClient: web3.publicClient });
  const staking = _staking(page);

  await page.goto('/staking');
  await staking.waitForReady();
  await staking.stake('50');
  await staking.closeTransaction();
  await expect(staking.staked()).toHaveText('50.00');

  await staking.withdraw('50');

  await balance.check({ address: web3.account.address, symbol: 'EXA', amount: '100' });
  await expect(staking.staked()).toHaveText('0.00');
});

test('claim staking rewards', async ({ page, web3 }) => {
  await web3.anvil.setBalance(web3.account.address, { ETH: 1, EXA: 100 });
  const app = _app({ test, page });
  const staking = _staking(page);
  const reward = await erc20Market('USDC', { publicClient: web3.publicClient });

  await page.goto('/staking');
  await staking.waitForReady();
  await staking.stake('50');

  await web3.anvil.increaseTime(7 * 24 * 60 * 60);
  await app.reload();

  await staking.claim();

  expect(await reward.read.balanceOf([web3.account.address])).toBeGreaterThan(0n);
});
