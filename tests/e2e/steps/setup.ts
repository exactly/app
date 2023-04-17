import { Wallet } from '@ethersproject/wallet';
import { JsonRpcProvider, getDefaultProvider } from '@ethersproject/providers';

import { createFork, deleteFork, rpcURL, setBalance } from '../utils/tenderly';
import type { Balance } from '../utils/tenderly';
import { CustomizedBridge } from '../utils/bridge';
import { connectWallet, disconnectWallet } from './wallet';
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

type SetupParams = {
  chainId?: number;
  wallet?: { address: string; privateKey: string };
  useDefaultProvider?: boolean;
};

export const setup = ({
  chainId = 1,
  wallet = Wallet.createRandom(),
  useDefaultProvider = false,
}: SetupParams = {}) => {
  let forkId: string | undefined = undefined;

  before(async () => {
    if (!useDefaultProvider) {
      forkId = await createFork(String(chainId));
    }
  });

  after(async () => {
    if (forkId) {
      await deleteFork(forkId);
    }
  });

  const provider = () =>
    useDefaultProvider ? getDefaultProvider(chainId) : new JsonRpcProvider(rpcURL(forkId), chainId);
  const signer = () => new Wallet(wallet.privateKey, provider());
  const ethereum = () => new CustomizedBridge(signer(), provider(), Number(chainId));

  Cypress.on('window:before:load', (window) => {
    window.localStorage.setItem('tos', 'true');

    window.ethereum = ethereum();
    if (!useDefaultProvider) {
      window.rpcURL = rpcURL(forkId);
    }
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
          } else {
            disconnectWallet();
          }
          justWait();
        });
    },
    userAddress: () => wallet.address,
    setBalance: (address: string, balance: Balance) => setBalance(rpcURL(forkId), address, balance),
    signer,
    provider,
  };
};
