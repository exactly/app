import { Wallet } from '@ethersproject/wallet';
import { JsonRpcProvider } from '@ethersproject/providers';

import { init, createFork, deleteFork, rpcURL, setBalance } from '../utils/tenderly';
import type { Balance } from '../utils/tenderly';
import { CustomizedBridge } from '../utils/bridge';

type MarketView = 'simple' | 'advanced';

type VisitOptions = {
  marketView?: MarketView;
};

const defaultVisitOptions: VisitOptions = {
  marketView: 'advanced',
};

type ForkParams = {
  chainId?: number | string;
  wallet?: { address: string; privateKey: string };
};

export const setupFork = ({ chainId = 1, wallet = Wallet.createRandom() }: ForkParams = {}) => {
  let forkId: string | undefined = undefined;

  before(async () => {
    await init();
    forkId = await createFork(String(chainId));
  });

  after(async () => {
    if (forkId) {
      await deleteFork(forkId);
    }
  });

  return {
    visit: (url: string, options: { marketView?: 'simple' | 'advanced' } = {}) => {
      const opts = { ...defaultVisitOptions, ...options };
      const provider = new JsonRpcProvider(rpcURL(forkId), chainId);
      const signer = new Wallet(wallet.privateKey, provider);
      const bridge = new CustomizedBridge(signer, provider, Number(chainId));
      return cy.visit(url, {
        onBeforeLoad: (window) => {
          window.localStorage.setItem('tos', 'true');
          window.localStorage.setItem('marketView', opts.marketView);

          window.ethereum = bridge;
          window.rpcURL = rpcURL(forkId);
        },
      });
    },
    userAddress: () => wallet.address,
    setBalance: (address: string, balance: Balance) => setBalance(rpcURL(forkId), address, balance),
  };
};
