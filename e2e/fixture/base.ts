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
import { anvil as anvilChain, type Chain } from 'viem/chains';

import { anvil, type Anvil } from '../utils/anvil';
import actions, { type Actions } from './actions';
import socket, { type Socket } from './socket';
import graph, { type Graph } from './graph';
import time, { type Time } from './time';

type MarketView = 'simple' | 'advanced';

type Options = {
  marketView: MarketView;
};

const defaultOptions = {
  marketView: 'advanced',
} as const;

export const chain: Chain = anvilChain;

const defaultPrivateKey = generatePrivateKey();

type Web2 = {
  socket: Socket;
  graph: Graph;
  time: Time;
};

type Web3 = {
  account: Account;
  publicClient: PublicClient;
  walletClient: WalletClient;
  anvil: Anvil;
};

type TestProps = {
  options: Options;
  privateKey: Address;
  web2: Web2;
  web3: Web3;
  setup: Actions;
};

declare global {
  interface Window {
    e2e: { rpc: string; chainId: number; privateKey: Address };
  }
}

const baseTest = test.extend<TestProps, { anvil: Anvil }>({
  bypassCSP: true,
  privateKey: [defaultPrivateKey, { option: true }],
  options: [defaultOptions, { option: true }],
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    page.goto = ((url, options) => test.step(`navigation: ${url}`, () => goto(url, options))) as typeof page.goto;
    await use(page);
  },
  anvil: [
    async ({ browserName }, use) => {
      void browserName;
      const local = await anvil();
      await use(local);
      await local.destroy();
    },
    { scope: 'worker' },
  ],
  web2: async ({ page }, use) => {
    await use({ graph: graph(page), time: time(page), socket: socket(page) });
  },
  web3: async ({ page, anvil: local, privateKey, options }, use) => {
    const account = privateKeyToAccount(privateKey);
    const snapshot = await local.snapshot();

    const walletClient = createWalletClient({ account, chain, transport: http(local.url()) });
    const publicClient = createPublicClient({ chain, transport: http(local.url()) });

    const injected = { privateKey: privateKey, rpc: local.url(), chainId: chain.id };

    await page.addInitScript((_injected) => {
      window.e2e = _injected;
    }, injected);

    await page.addInitScript((opts) => {
      window.localStorage.setItem('marketView', opts.marketView);
    }, options);

    await use({ account, publicClient, walletClient, anvil: local });

    await local.revert(snapshot);
  },
  setup: async ({ web3 }, use) => {
    const { publicClient, walletClient } = web3;
    await use(actions({ publicClient, walletClient }));
  },
});

const base = () => baseTest;

export type BaseTest = typeof baseTest;

export default base;
