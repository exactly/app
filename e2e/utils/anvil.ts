import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, open, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { promisify } from 'node:util';

import { test } from '@playwright/test';
import { Instance, Pool } from 'prool';
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
import { anvil as anvilChain } from 'viem/chains';

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
let cached: Promise<Anvil> | undefined;
let destroyTimer: NodeJS.Timeout | undefined;

const start = async (params: { dumpState?: string; loadState?: string } = {}, deploy = true): Promise<Anvil> => {
  const pool = Pool.define({
    instance: Instance.anvil({
      autoImpersonate: true,
      balance: 1_000_000n,
      chainId: anvilChain.id,
      codeSizeLimit: 100_000,
      disableBlockGasLimit: true,
      hardfork: 'Cancun',
      ...params,
    }),
  });
  const instance = await pool.start(1);
  const url = `http://${instance.host}:${instance.port}`;
  const transport = http(url);
  const walletClient = createWalletClient<typeof transport, typeof anvilChain, typeof deployer, AnvilRpcSchema>({
    account: deployer,
    chain: anvilChain,
    transport,
  });
  const publicClient = createPublicClient({ chain: anvilChain, transport });

  if (deploy) {
    await execFileAsync(
      'forge',
      [
        'script',
        'script/Protocol.s.sol:DeployProtocol',
        '--broadcast',
        '--rpc-url',
        url,
        '--private-key',
        deployerPrivateKey,
      ],
      { cwd: new URL('../foundry', import.meta.url), timeout: 120_000 },
    );
  }

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
            await token.write.transfer([address, amount], { account: deployer, chain: anvilChain });
          } else if (symbol === 'esEXA') {
            const exa = await erc20('EXA', { publicClient, walletClient });
            await exa.write.transfer([address, amount], { account: deployer, chain: anvilChain });
            await exa.write.approve([token.address, amount], { account: address, chain: anvilChain });
            await getContract({
              address: token.address,
              abi: escrowedExaAbi,
              client: { public: publicClient, wallet: walletClient },
            }).write.mint([amount, address], { account: address, chain: anvilChain });
          } else {
            await token.write.mint([address, amount], { account: deployer, chain: anvilChain });
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
    destroy: () => pool.destroy(1),
  };
};

export const anvil = async (): Promise<Anvil> => {
  if (destroyTimer) {
    clearTimeout(destroyTimer);
    destroyTimer = undefined;
  }

  const current = (cached ??= (async () => {
    const state = process.env.E2E_ANVIL_STATE;

    if (!state) return start();
    await mkdir(dirname(state), { recursive: true });

    const lockPath = `${state}.lock`;
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
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    return start({ loadState: state }, false);
  })());
  const local = await current;

  return {
    ...local,
    destroy: async () => {
      if (destroyTimer) clearTimeout(destroyTimer);
      destroyTimer = setTimeout(() => {
        void current
          .then((instance) => instance.destroy())
          .finally(() => {
            if (cached === current) cached = undefined;
          });
      }, 1_000);
    },
  };
};
