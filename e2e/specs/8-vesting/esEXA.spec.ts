import { parseEther } from 'viem';

import base, { chain } from '../../fixture/base';
import _app from '../../common/app';
import _balance from '../../common/balance';
import _allowance from '../../common/allowance';
import _vesting from '../../page/vesting';
import { escrowedEXA, sablierV2LockupLinear, erc20 } from '../../utils/contracts';

const test = base();

test.describe.configure({ mode: 'serial' });

test('Vesting esEXA & Claiming EXA', async ({ page, web2, web3 }) => {
  await web3.fork.setBalance(web3.account.address, {
    ETH: 1,
    esEXA: 100,
    EXA: 20,
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

  await test.step('Vest esEXA', async () => {
    await vesting.checkBalanceAvailable('100.00');

    await vesting.input('1000');
    await vesting.checkError('Not enough EXA for reserve. Get EXA.');

    await vesting.input('100');
    await vesting.checkReserveNeeded('20%', '20');

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
      less: '0',
    });
  });

  const now = Date.now() / 1_000;

  await web3.fork.increaseTime(period / 2);
  await web2.time.now(now + period / 2);

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
    const id = Number(stream);
    await vesting.checkStream({
      id,
      vested: '100.00',
      reserved: '20.00',
      withdrawable: /50\.0|49\.9/,
      left: '100.00',
      progress: /50\.00%|50\.01%/,
    });

    await vesting.claimStream(id);
    await vesting.waitForClaimStreamTransaction(id);

    await balance.check({ address: web3.account.address, symbol: 'EXA', amount: '50', delta: '0.001' });
  });

  await web3.fork.increaseTime(period / 2);
  await web2.time.now(now + period);

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
    const id = Number(stream);
    await vesting.checkStream({
      id,
      vested: '100.00',
      reserved: '20.00',
      withdrawable: /50\.0|49\.9/,
      left: /50\.0|49\.9/,
      progress: '100%',
    });

    await vesting.claimStream(id);
    await vesting.waitForClaimStreamTransaction(id);

    await balance.check({ address: web3.account.address, symbol: 'EXA', amount: '120' });
  });
});

test('Claiming multiple streams', async ({ page, web2, web3 }) => {
  await web3.fork.setBalance(web3.account.address, {
    ETH: 1,
    esEXA: 100,
    EXA: 20,
  });

  const exa = await erc20('EXA', { walletClient: web3.walletClient });
  const esEXA = await escrowedEXA({ publicClient: web3.publicClient, walletClient: web3.walletClient });
  const sablier = await sablierV2LockupLinear({ publicClient: web3.publicClient });
  const stream = await sablier.read.nextStreamId();
  const period = await esEXA.read.vestingPeriod();

  await exa.write.approve([esEXA.address, 2n ** 256n - 1n], { account: web3.account, chain });
  await esEXA.write.vest([parseEther('50'), web3.account.address], { account: web3.account, chain });
  await esEXA.write.vest([parseEther('50'), web3.account.address], { account: web3.account, chain });

  const [stream0, stream1] = [stream, stream + 1n];

  const balance = _balance({ test, page, publicClient: web3.publicClient });
  const vesting = _vesting(page);

  const now = Date.now() / 1_000;

  await web3.fork.increaseTime(period * 2);
  await web2.time.now(now + period * 2);

  await web2.graph.streams([
    {
      id: `0xb923abdca17aed90eb5ec5e407bd37164f632bfd-10-${stream0}`,
      tokenId: String(stream0),
      recipient: web3.account.address,
      startTime: String(now),
      endTime: String(now + period),
      depositAmount: String(parseEther('50')),
      withdrawnAmount: '0',
      canceled: false,
    },
    {
      id: `0xb923abdca17aed90eb5ec5e407bd37164f632bfd-10-${stream1}`,
      tokenId: String(stream1),
      recipient: web3.account.address,
      startTime: String(now),
      endTime: String(now + period),
      depositAmount: String(parseEther('50')),
      withdrawnAmount: '0',
      canceled: false,
    },
  ]);

  await page.goto('/vesting');
  await vesting.waitForPageToBeReady();

  await test.step('Withdraw all depleted streams', async () => {
    const [id0, id1] = [Number(stream0), Number(stream1)];
    await vesting.checkStream({
      id: id0,
      vested: '50.00',
      reserved: '10.00',
      withdrawable: '50.00',
      left: '50.00',
      progress: '100%',
    });

    await vesting.checkStream({
      id: id1,
      vested: '50.00',
      reserved: '10.00',
      withdrawable: '50.00',
      left: '50.00',
      progress: '100%',
    });

    await vesting.claimAllStreams();
    await vesting.waitForClaimAllTransaction();

    await balance.check({ address: web3.account.address, symbol: 'EXA', amount: '120' });
  });
});
