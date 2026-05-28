import { expect } from '@playwright/test';
import { createWalletClient, http, parseEther } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

import { anvil as chain } from 'viem/chains';

import base from '../../fixture/base';
import _app from '../../common/app';
import _balance from '../../common/balance';
import _allowance from '../../common/allowance';
import _vesting from '../../page/vesting';
import { escrowedEXA, sablierV2LockupLinear, erc20 } from '../../utils/contracts';

const test = base();

test('Vesting esEXA & Claiming EXA', async ({ page, web2, web3 }) => {
  await web3.anvil.setBalance(web3.account.address, {
    ETH: 1,
    esEXA: 100,
    EXA: 25,
  });

  const esEXA = await escrowedEXA({ publicClient: web3.publicClient });
  const sablier = await sablierV2LockupLinear({ publicClient: web3.publicClient });
  const stream = await sablier.read.nextStreamId();
  const period = await esEXA.read.vestingPeriod();

  const app = _app({ test, page });
  const balance = _balance({ test, page, publicClient: web3.publicClient });
  const allowance = _allowance({ test, page, publicClient: web3.publicClient });
  const vesting = _vesting(page);

  await page.goto('/vesting');
  await vesting.waitForPageToBeReady();

  await test.step('flow: vest esEXA', async () => {
    await vesting.checkBalanceAvailable('100.00');

    await vesting.input('1000');
    await vesting.checkError('You need 225.00 more EXA for reserve. Get EXA.');

    await vesting.input('100');
    await vesting.checkReserveNeeded('25%', '25');

    await vesting.waitForSubmitToBeReady();
    await vesting.submit();
    await vesting.waitForVestTransaction();

    await vesting.checkVestTransactionStatus('success', 'Your esEXA has been vested');
    await vesting.closeVestTransaction();

    await balance.check({ address: web3.account.address, symbol: 'esEXA', amount: '0' });
    await balance.check({ address: web3.account.address, symbol: 'EXA', amount: '0' });
    await allowance.check({
      address: web3.account.address,
      type: 'erc20',
      symbol: 'EXA',
      spender: esEXA.address,
      less: '0.000000000000000001',
    });
  });

  const now = Math.ceil(Date.now() / 1_000);
  const half = Math.ceil(period / 2);

  await web3.anvil.increaseTime(half);
  await web2.time.now(now + half);

  await app.reload();

  await test.step('flow: withdraw vested EXA halfway', async () => {
    const id = Number(stream);
    await vesting.checkStream({
      id,
      vested: '100.00',
      reserved: '25.00',
      withdrawable: /50\.0|49\.9/,
      left: '100.00',
      progress: /49\.9\d%|50\.0\d%/,
    });

    await vesting.claimStream(id);
    await vesting.waitForClaimStreamTransaction(id);

    await balance.check({ address: web3.account.address, symbol: 'EXA', amount: '50', delta: '0.001' });
  });

  await web3.anvil.increaseTime(half);
  await web2.time.now(now + period);

  await app.reload();

  await test.step('flow: withdraw depleted EXA stream', async () => {
    const id = Number(stream);
    await vesting.checkStream({
      id,
      vested: '100.00',
      reserved: '25.00',
      withdrawable: /50\.0|49\.9/,
      left: /50\.0|49\.9/,
      progress: '100%',
    });

    await vesting.claimStream(id);
    await vesting.waitForClaimStreamTransaction(id);

    await balance.check({ address: web3.account.address, symbol: 'EXA', amount: '125' });
  });
});

test('Claiming multiple streams', async ({ page, web2, web3 }) => {
  await web3.anvil.setBalance(web3.account.address, {
    ETH: 1,
    esEXA: 100,
    EXA: 25,
  });

  const exa = await erc20('EXA', { walletClient: web3.walletClient });
  const esEXA = await escrowedEXA({ publicClient: web3.publicClient, walletClient: web3.walletClient });
  const sablier = await sablierV2LockupLinear({ publicClient: web3.publicClient });
  const stream = await sablier.read.nextStreamId();
  const period = await esEXA.read.vestingPeriod();
  const reserveRatio = await esEXA.read.reserveRatio();

  await web3.publicClient.waitForTransactionReceipt({
    hash: await exa.write.approve([esEXA.address, 2n ** 256n - 1n], { account: web3.account, chain }),
  });
  await web3.publicClient.waitForTransactionReceipt({
    hash: await esEXA.write.vest([parseEther('50'), web3.account.address, reserveRatio, BigInt(period)], {
      account: web3.account,
      chain,
    }),
  });
  await web3.publicClient.waitForTransactionReceipt({
    hash: await esEXA.write.vest([parseEther('50'), web3.account.address, reserveRatio, BigInt(period)], {
      account: web3.account,
      chain,
    }),
  });

  const [stream0, stream1] = [stream, stream + 1n];

  const balance = _balance({ test, page, publicClient: web3.publicClient });
  const vesting = _vesting(page);

  const now = Math.ceil(Date.now() / 1_000);

  await web3.anvil.increaseTime(period * 2);
  await web2.time.now(now + period * 2);

  await page.goto('/vesting');
  await vesting.waitForPageToBeReady();

  await test.step('flow: withdraw all depleted streams', async () => {
    const [id0, id1] = [Number(stream0), Number(stream1)];

    await vesting.checkStream({
      id: id0,
      vested: '50.00',
      reserved: '12.50',
      withdrawable: '50.00',
      left: '50.00',
      progress: '100%',
    });

    await vesting.checkStream({
      id: id1,
      vested: '50.00',
      reserved: '12.5',

      withdrawable: '50.00',
      left: '50.00',
      progress: '100%',
    });

    await vesting.claimAllStreams();
    await vesting.waitForClaimAllTransaction();

    await balance.check({ address: web3.account.address, symbol: 'EXA', amount: '125' });
  });
});

test('Transferred stream follows Sablier NFT ownership', async ({ page, web3 }) => {
  const sender = privateKeyToAccount(generatePrivateKey());
  const senderWalletClient = createWalletClient({ account: sender, chain, transport: http(web3.anvil.url()) });

  await web3.anvil.setBalance(web3.account.address, { ETH: 1 });
  await web3.anvil.setBalance(sender.address, {
    ETH: 1,
    esEXA: 200,
    EXA: 50,
  });

  const exa = await erc20('EXA', { walletClient: senderWalletClient });
  const esEXA = await escrowedEXA({ publicClient: web3.publicClient, walletClient: senderWalletClient });
  const sablier = await sablierV2LockupLinear({ publicClient: web3.publicClient, walletClient: senderWalletClient });
  const stream = await sablier.read.nextStreamId();
  const period = await esEXA.read.vestingPeriod();
  const reserveRatio = await esEXA.read.reserveRatio();

  await web3.publicClient.waitForTransactionReceipt({
    hash: await exa.write.approve([esEXA.address, 2n ** 256n - 1n], { account: sender, chain }),
  });
  await web3.publicClient.waitForTransactionReceipt({
    hash: await esEXA.write.vest([parseEther('100'), sender.address, reserveRatio, BigInt(period)], {
      account: sender,
      chain,
    }),
  });
  await web3.publicClient.waitForTransactionReceipt({
    hash: await esEXA.write.vest([parseEther('100'), sender.address, reserveRatio, BigInt(period)], {
      account: sender,
      chain,
    }),
  });

  const vesting = _vesting(page);
  const [senderOnlyStream, transferredStream] = [stream, stream + 1n];

  await web3.publicClient.waitForTransactionReceipt({
    hash: await sablier.write.transferFrom([sender.address, web3.account.address, transferredStream], {
      account: sender,
      chain,
    }),
  });
  await page.goto('/vesting');
  await vesting.waitForPageToBeReady();
  await expect(page.getByTestId(`vesting-stream-${Number(senderOnlyStream)}`)).toHaveCount(0);
  await vesting.checkStream({
    id: Number(transferredStream),
    vested: '100.00',
    reserved: '25.00',
    withdrawable: /^0\.\d{2}$/,
    left: '100.00',
    progress: /^0(?:\.\d{1,2})?%$/,
  });

  await web3.publicClient.waitForTransactionReceipt({
    hash: await (
      await sablierV2LockupLinear({ publicClient: web3.publicClient, walletClient: web3.walletClient })
    ).write.transferFrom([web3.account.address, sender.address, transferredStream], { account: web3.account, chain }),
  });
  await page.reload();
  await vesting.waitForPageToBeReady();
  await expect(page.getByText('No vesting streams active yet.')).toBeVisible();
});

test('Stream cancellation', async ({ page, web3 }) => {
  await web3.anvil.setBalance(web3.account.address, {
    ETH: 1,
    esEXA: 100,
    EXA: 25,
  });

  const exa = await erc20('EXA', { walletClient: web3.walletClient });
  const esEXA = await escrowedEXA({ publicClient: web3.publicClient, walletClient: web3.walletClient });
  const sablier = await sablierV2LockupLinear({ publicClient: web3.publicClient });
  const stream = await sablier.read.nextStreamId();
  const period = await esEXA.read.vestingPeriod();
  const reserveRatio = await esEXA.read.reserveRatio();

  await web3.publicClient.waitForTransactionReceipt({
    hash: await exa.write.approve([esEXA.address, 2n ** 256n - 1n], { account: web3.account, chain }),
  });
  await web3.publicClient.waitForTransactionReceipt({
    hash: await esEXA.write.vest([parseEther('100'), web3.account.address, reserveRatio, BigInt(period)], {
      account: web3.account,
      chain,
    }),
  });

  const balance = _balance({ test, page, publicClient: web3.publicClient });
  const vesting = _vesting(page);

  await page.goto('/vesting');
  await vesting.waitForPageToBeReady();

  await test.step('flow: cancel vesting stream', async () => {
    const id = Number(stream);
    await vesting.checkStream({
      id,
      vested: '100.00',
      reserved: '25.00',
      withdrawable: /^0\.\d{2}$/,
      left: '100.00',
      progress: /^0(?:\.\d{1,2})?%$/,
    });

    await vesting.cancelStream(id);
    await vesting.waitForStreamCancelTransaction(id);

    await balance.check({ address: web3.account.address, symbol: 'EXA', amount: '25', delta: '0.001' });
    await balance.check({ address: web3.account.address, symbol: 'esEXA', amount: '100', delta: '0.001' });
  });
});
