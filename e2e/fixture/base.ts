import { test } from '@playwright/test';
import {
  type Account,
  type Address,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  http,
} from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { Chain, optimism } from 'viem/chains';
import * as fs from 'fs/promises';

import { type Tenderly, tenderly } from '../utils/tenderly';
import actions, { Actions } from './actions';

type MarketView = 'simple' | 'advanced';

type Options = {
  marketView: MarketView;
};

const defaultOptions = {
  marketView: 'advanced',
} as const;

type TestParams = {
  chain?: Chain;
  privateKey?: Address;
  options?: Options;
};

const defaultTestParams = {
  chain: optimism,
  privateKey: generatePrivateKey(),
  options: defaultOptions,
} as const;

type Web3 = {
  account: Account;
  publicClient: PublicClient;
  walletClient: WalletClient;
  fork: Tenderly;
};

type TestProps = {
  web3: Web3;
  setup: Actions;
};

const base = (params: TestParams = defaultTestParams) =>
  test.extend<TestProps>({
    bypassCSP: true,
    web3: async ({ page }, use) => {
      const { chain, privateKey, options } = {
        chain: params.chain ?? defaultTestParams.chain,
        privateKey: params.privateKey ?? defaultTestParams.privateKey,
        options: {
          marketView: params.options?.marketView ?? defaultTestParams.options.marketView,
        },
      };
      const account = privateKeyToAccount(privateKey);
      const fork: Tenderly = await tenderly({ chain });

      const walletClient = createWalletClient({ account, chain, transport: http(fork.url()) });
      const publicClient = createPublicClient({ chain, transport: http(fork.url()) });

      const { pathname: root } = new URL('../', import.meta.url);
      const injected = (await fs.readFile(`${root}/fixture/injected.txt`, { encoding: 'utf-8' }))
        .replace('__RPC_URL', fork.url())
        .replace('__CHAIN_ID', String(chain.id))
        .replace('__PRIVATE_KEY', privateKey);

      await page.addInitScript(injected);

      await page.addInitScript((opts) => {
        window.localStorage.setItem('marketView', opts.marketView);
      }, options);

      await use({ account, publicClient, walletClient, fork });

      await fork.deleteFork();
    },
    setup: async ({ web3 }, use) => {
      const { publicClient, walletClient } = web3;
      await use(actions({ publicClient, walletClient }));
    },
  });

export type BaseTest = ReturnType<typeof base>;

export default base;
