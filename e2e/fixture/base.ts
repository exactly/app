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

type TestParams = {
  chain?: Chain;
  privateKey?: Address;
};

type Web3 = {
  account: Account;
  publicClient: PublicClient;
  walletClient: WalletClient;
  fork: Tenderly;
};

type TestProps = {
  web3: Web3;
};

export default ({ chain = optimism, privateKey = generatePrivateKey() }: TestParams = {}) =>
  test.extend<TestProps>({
    bypassCSP: true,
    actionTimeout: 30000,
    web3: async ({ page }, use) => {
      const account = privateKeyToAccount(privateKey);
      const fork: Tenderly = await tenderly({ chain });

      const walletClient = createWalletClient({ account, chain, transport: http(fork.url()) });
      const publicClient = createPublicClient({ chain, transport: http(fork.url()) });

      const { pathname: root } = new URL('../', import.meta.url);
      const injected = (await fs.readFile(`${root}/fixture/provider.js`, { encoding: 'utf-8' }))
        .replace('__RPC_URL', fork.url())
        .replace('__CHAIN_ID', String(chain.id))
        .replace('__PRIVATE_KEY', privateKey);

      await page.addInitScript(injected);

      page.once('close', async () => {
        await fork.deleteFork();
      });

      await use({ account, publicClient, walletClient, fork });
    },
  });
