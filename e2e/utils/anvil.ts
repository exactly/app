import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, open, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { test } from '@playwright/test';
import { Instance, Pool, Server } from 'prool';
import {
  createPublicClient,
  createWalletClient,
  getContract,
  http,
  parseEther,
  parseUnits,
  toHex,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil as chain } from 'viem/chains';

import { erc20, type Coin } from './contracts';
import { escrowedExaAbi } from '../../generated/wagmi';

export type Balance = {
  [key in Coin]?: number;
};

export type Anvil = {
  url: () => string;
  setBalance: (address: Address, balance: Balance) => Promise<void>;
  increaseTime: (timestamp: number) => Promise<void>;
  snapshot: () => Promise<Hex>;
  revert: (id: Hex) => Promise<void>;
  destroy: () => Promise<void>;
};

type AnvilRpcSchema = [
  { Method: 'anvil_setBalance'; Parameters: [address: Address, balance: Hex]; ReturnType: null },
  { Method: 'evm_increaseTime'; Parameters: [timestamp: Hex]; ReturnType: unknown },
  { Method: 'evm_mine'; Parameters: []; ReturnType: unknown },
  { Method: 'evm_snapshot'; Parameters: []; ReturnType: Hex },
  { Method: 'evm_revert'; Parameters: [id: Hex]; ReturnType: boolean },
];

const execFileAsync = promisify(execFile);
const deployerPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const deployer = privateKeyToAccount(deployerPrivateKey);

const instance = (params: { dumpState?: string; loadState?: string } = {}) =>
  Instance.anvil({
    autoImpersonate: true,
    balance: 1_000_000n,
    blockBaseFeePerGas: 0,
    chainId: chain.id,
    codeSizeLimit: 1_000_000,
    disableBlockGasLimit: true,
    gasPrice: 0,
    hardfork: 'Cancun',
    ...params,
  });

const start = async (params: { dumpState?: string; loadState?: string } = {}, deploy = true): Promise<Anvil> => {
  const pool = Pool.define({
    instance: instance(params),
  });
  const local = await pool.start(1);
  const url = `http://${local.host}:${local.port}`;
  const result = await connect(url, () => pool.destroy(1));

  if (deploy) {
    await execFileAsync(
      'forge',
      [
        'script',
        'script/Protocol.s.sol:DeployProtocol',
        '--broadcast',
        '--disable-code-size-limit',
        '--rpc-url',
        url,
        '--private-key',
        deployerPrivateKey,
      ],
      { cwd: new URL('../foundry', import.meta.url), timeout: 210_000 },
    );
  }

  return result;
};

const connect = async (url: string, destroy: () => Promise<void>): Promise<Anvil> => {
  const transport = http(url);
  const walletClient = createWalletClient<typeof transport, typeof chain, typeof deployer, AnvilRpcSchema>({
    account: deployer,
    chain,
    transport,
  });
  const publicClient = createPublicClient({ chain, transport });

  return {
    url: () => url,
    setBalance: (address, balance) =>
      test.step(`setup: set account balance ${Object.entries(balance)
        .filter(([, value]) => value)
        .map(([symbol, value]) => `${value} ${symbol}`)
        .join(', ')}`, async () => {
        for (const symbol of Object.keys(balance) as Array<keyof typeof balance>) {
          const value = balance[symbol];
          if (!value) continue;
          if (symbol === 'ETH') {
            await walletClient.request({
              method: 'anvil_setBalance',
              params: [address, toHex(parseEther(String(value)))],
            });
            continue;
          }

          const token = await erc20(symbol, { publicClient, walletClient });
          const amount = parseUnits(String(value), await token.read.decimals());

          if (symbol === 'EXA') {
            await publicClient.waitForTransactionReceipt({
              hash: await token.write.transfer([address, amount], { account: deployer, chain }),
            });
          } else if (symbol === 'esEXA') {
            const exa = await erc20('EXA', { publicClient, walletClient });
            await publicClient.waitForTransactionReceipt({
              hash: await exa.write.transfer([address, amount], { account: deployer, chain }),
            });
            await publicClient.waitForTransactionReceipt({
              hash: await exa.write.approve([token.address, amount], { account: address, chain }),
            });
            await publicClient.waitForTransactionReceipt({
              hash: await getContract({
                address: token.address,
                abi: escrowedExaAbi,
                client: { public: publicClient, wallet: walletClient },
              }).write.mint([amount, address], { account: address, chain }),
            });
          } else {
            await publicClient.waitForTransactionReceipt({
              hash: await token.write.mint([address, amount], { account: deployer, chain }),
            });
          }
        }
      }),
    increaseTime: (timestamp) =>
      test.step(`setup: increase time ${timestamp}s`, async () => {
        await walletClient.request({ method: 'evm_increaseTime', params: [toHex(Math.floor(timestamp))] });
        await walletClient.request({ method: 'evm_mine', params: [] });
      }),
    snapshot: () => walletClient.request({ method: 'evm_snapshot', params: [] }),
    revert: async (id) => {
      if (!(await walletClient.request({ method: 'evm_revert', params: [id] }))) {
        throw new Error('Failed to revert anvil');
      }
    },
    destroy,
  };
};

const prepareState = async () => {
  const state = 'test-results/anvil.json';

  await mkdir(dirname(state), { recursive: true });
  const lockPath = `${state}.lock`;
  if (!existsSync(lockPath)) await rm(state, { force: true });

  while (!existsSync(state) || existsSync(lockPath)) {
    try {
      const lock = await open(lockPath, 'wx');
      try {
        await (await start({ dumpState: state })).destroy();
      } finally {
        await lock.close();
        await rm(lockPath, { force: true });
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      await new Promise((done) => setTimeout(done, 250));
    }
  }

  return state;
};

export const anvil = async (id = 1): Promise<Anvil> => {
  const port = process.env.E2E_ANVIL_PORT;

  if (port) {
    const request = async (action: 'reset' | 'stop') => {
      const response = await fetch(`http://127.0.0.1:${port}/${id}/${action === 'reset' ? 'restart' : action}`);
      if (!response.ok) throw new Error(`Failed to ${action} anvil ${id}`);
    };

    await request('reset');
    return connect(`http://127.0.0.1:${port}/${id}`, async () => {
      await request('stop');
    });
  }

  return start({ loadState: await prepareState() }, false);
};

export const serve = async () => {
  const server = Server.create({ instance: instance({ loadState: await prepareState() }) });
  const stop = await server.start();
  const address = server.address();

  if (!address) throw new Error('Failed to start anvil server');
  process.stdout.write(`Anvil server listening on ${address.port}\n`);

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      void stop().catch(() => {
        process.exitCode = 1;
      });
    });
  }
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) void serve();
