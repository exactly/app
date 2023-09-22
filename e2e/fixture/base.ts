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
import { optimism, type Chain } from 'viem/chains';

import { type Tenderly, tenderly } from '../utils/tenderly';
import actions, { Actions } from './actions';

type MarketView = 'simple' | 'advanced';

type Options = {
  marketView: MarketView;
};

const defaultOptions = {
  marketView: 'advanced',
} as const;

export const chain: Chain = optimism;

type TestParams = {
  privateKey?: Address;
  options?: Options;
};

const defaultTestParams = {
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

declare global {
  interface Window {
    e2e: { rpc: string; chainId: number; privateKey: Address };
  }
}

const base = (params: TestParams = defaultTestParams) =>
  test.extend<TestProps>({
    bypassCSP: true,
    web3: async ({ page }, use) => {
      const { privateKey, options } = {
        privateKey: params.privateKey ?? defaultTestParams.privateKey,
        options: {
          marketView: params.options?.marketView ?? defaultTestParams.options.marketView,
        },
      };
      const account = privateKeyToAccount(privateKey);
      const fork: Tenderly = await tenderly({ chain });

      const walletClient = createWalletClient({ account, chain, transport: http(fork.url()) });
      const publicClient = createPublicClient({ chain, transport: http(fork.url()) });

      const injected = { privateKey: privateKey, rpc: fork.url(), chainId: chain.id };

      await page.addInitScript((_injected) => {
        window.e2e = _injected;
      }, injected);

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
