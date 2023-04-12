import { Wallet } from '@ethersproject/wallet';
import { JsonRpcProvider } from '@ethersproject/providers';

import { createFork, deleteFork, rpcURL, setBalance } from '../utils/tenderly';
import type { Balance } from '../utils/tenderly';
import { CustomizedBridge } from '../utils/bridge';
import { connectWallet } from './wallet';
import { justWait } from './actions';

type MarketView = 'simple' | 'advanced';

type VisitOptions = {
  connectWallet?: boolean;
  marketView?: MarketView;
};

const defaultVisitOptions: VisitOptions = {
  connectWallet: true,
  marketView: 'advanced',
};

type ForkParams = {
  chainId?: number | string;
  wallet?: { address: string; privateKey: string };
};

export const setupFork = ({ chainId = 1, wallet = Wallet.createRandom() }: ForkParams = {}) => {
  let forkId: string | undefined = undefined;

  before(async () => {
    forkId = await createFork(String(chainId));
  });

  after(async () => {
    if (forkId) {
      await deleteFork(forkId);
    }
  });

  const provider = () => new JsonRpcProvider(rpcURL(forkId), chainId);
  const signer = () => new Wallet(wallet.privateKey, provider());
  const ethereum = () => new CustomizedBridge(signer(), provider(), Number(chainId));

  Cypress.on('window:before:load', (window) => {
    window.localStorage.setItem('tos', 'true');

    window.ethereum = ethereum();
    window.rpcURL = rpcURL(forkId);
  });

  return {
    visit: (url: string, options: VisitOptions = {}) => {
      const opts = { ...defaultVisitOptions, ...options };
      return cy
        .visit(url, {
          onBeforeLoad: (window) => {
            window.localStorage.setItem('marketView', opts.marketView);
          },
        })
        .then(async () => {
          justWait();
          if (opts.connectWallet) {
            connectWallet();
            justWait();
          }
        });
    },
    userAddress: () => wallet.address,
    setBalance: (address: string, balance: Balance) => setBalance(rpcURL(forkId), address, balance),
    signer,
  };
};
