import { ethers } from 'ethers';

export type Web3ProviderState = {
  provider: any;
  web3Provider: ethers.providers.Web3Provider | undefined;
  walletAddress: string | undefined;
  network: ethers.providers.Network | undefined;
  connect: (() => Promise<void>) | null;
  disconnect: (() => Promise<void>) | null;
};

export const web3InitialState: Web3ProviderState = {
  provider: null,
  web3Provider: undefined,
  walletAddress: undefined,
  network: undefined,
  connect: null,
  disconnect: null
};

export type Web3Action =
  | {
      type: 'SET_WEB3_PROVIDER';
      provider?: Web3ProviderState['provider'];
      web3Provider?: Web3ProviderState['web3Provider'];
      walletAddress?: Web3ProviderState['walletAddress'];
      network?: Web3ProviderState['network'];
    }
  | {
      type: 'SET_ADDRESS';
      walletAddress?: Web3ProviderState['walletAddress'];
    }
  | {
      type: 'SET_NETWORK';
      network?: Web3ProviderState['network'];
    }
  | {
      type: 'RESET_WEB3_PROVIDER';
    };

export function web3Reducer(state: Web3ProviderState, action: Web3Action): Web3ProviderState {
  switch (action.type) {
    case 'SET_WEB3_PROVIDER':
      return {
        ...state,
        provider: action.provider,
        web3Provider: action.web3Provider,
        walletAddress: action.walletAddress,
        network: action.network
      };
    case 'SET_ADDRESS':
      return {
        ...state,
        walletAddress: action.walletAddress
      };
    case 'SET_NETWORK':
      return {
        ...state,
        network: action.network
      };
    case 'RESET_WEB3_PROVIDER':
      return web3InitialState;
    default:
      throw new Error();
  }
}
