import { Address, createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { Chain, optimism } from 'viem/chains';

import { Wallet } from '@ethersproject/wallet';

import type { Balance, Tenderly } from '../utils/tenderly';
import { tenderly } from '../utils/tenderly';
import { CustomizedBridge } from '../utils/bridge';
import { connectWallet, disconnectWallet } from './wallet';
import { justWait } from './actions';
import { getDefaultProvider, JsonRpcProvider } from '@ethersproject/providers';

type MarketView = 'simple' | 'advanced';

type VisitOptions = {
  connectWallet?: boolean;
  marketView?: MarketView;
};

const defaultVisitOptions: VisitOptions = {
  connectWallet: true,
  marketView: 'advanced',
} as const;

type SetupParams = {
  chain?: Chain;
  privateKey?: Address;
  useDefaultProvider?: boolean;
};

export const setup = ({
  chain = optimism,
  privateKey = generatePrivateKey(),
  useDefaultProvider = false,
}: SetupParams = {}) => {
  const account = privateKeyToAccount(privateKey);

  let fork: Tenderly | null = null;
  before(async () => {
    if (!useDefaultProvider) {
      fork = await tenderly({ chain });
    }
  });

  after(async () => {
    if (fork) {
      await fork.deleteFork();
    }
  });

  const walletClient = () => createWalletClient({ account, chain, transport: http(fork ? fork.url() : undefined) });
  const publicClient = () => createPublicClient({ chain, transport: http(fork ? fork.url() : undefined) });

  const ethereum = () => {
    const provider = fork ? new JsonRpcProvider(fork.url(), chain.id) : getDefaultProvider(chain.id);
    const signer = new Wallet(privateKey, provider);
    return new CustomizedBridge(signer, chain.id);
  };

  Cypress.on('window:before:load', (window) => {
    window.ethereum = ethereum();
    if (!useDefaultProvider && fork) {
      window.rpcURL = fork.url();
    }
  });

  return {
    visit: (url: string, options: VisitOptions = {}) => {
      const opts = { ...defaultVisitOptions, ...options };
      return cy
        .visit(url, {
          onBeforeLoad: (window) => {
            window.localStorage.setItem('marketView', opts.marketView ?? 'advanced');
          },
        })
        .then(async () => {
          justWait();
          if (opts.connectWallet) {
            connectWallet();
          } else {
            disconnectWallet();
          }
          justWait();
        });
    },
    userAddress: () => account.address,
    setBalance: (address: Address, balance: Balance) => fork?.setBalance(address, balance),
    publicClient,
    walletClient,
  };
};
