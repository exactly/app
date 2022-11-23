import { useEffect, useReducer, useCallback } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';

import { Web3ProviderState, Web3Action, web3InitialState, web3Reducer } from 'reducers/web3';
import analytics from 'utils/analytics';

let web3Modal: Web3Modal | null;

if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions: {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: `${process.env.NEXT_INFURA_ID}`,
          rpc: {
            1: `https://mainnet.infura.io/v3/a6e9caa47aa94595bfb2b0503edf880c`,
            5: 'https://goerli.infura.io/v3/a6e9caa47aa94595bfb2b0503edf880c',
          },
          chainId: 4,
        },
      },
    },
  });
}

export const useWeb3 = () => {
  const [state, dispatch] = useReducer(web3Reducer, web3InitialState);
  const { provider, web3Provider, walletAddress, network } = state;

  const connect = useCallback(async () => {
    if (web3Modal) {
      try {
        const provider = await web3Modal.connect();
        const web3Provider = new Web3Provider(provider);
        const signer = web3Provider.getSigner();
        const walletAddress = await signer.getAddress();
        const network = await web3Provider.getNetwork();

        dispatch({
          type: 'SET_WEB3_PROVIDER',
          provider,
          web3Provider,
          walletAddress,
          network,
        } as Web3Action);
      } catch (err) {
        console.log('connect error', err);
      } finally {
        analytics.identify(walletAddress ? walletAddress : 'anon');
      }
    } else {
      console.error('No Web3Modal');
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (web3Modal) {
      await web3Modal.clearCachedProvider();
      if (provider?.disconnect && typeof provider.disconnect === 'function') {
        await provider.disconnect();
      }

      dispatch({
        type: 'RESET_WEB3_PROVIDER',
      } as Web3Action);
    } else {
      console.error('No Web3Modal');
    }
  }, [provider]);

  // Auto connect to the cached provider
  useEffect(() => {
    if (web3Modal && web3Modal.cachedProvider) {
      connect();
    }
  }, [connect]);

  // EIP-1193 events
  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        dispatch({
          type: 'SET_ADDRESS',
          walletAddress: accounts[0],
        } as Web3Action);
      };

      const handleChainChanged = () => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      };

      const handleDisconnect = () => {
        disconnect();
      };

      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
      try {
        provider.on('disconnect', handleDisconnect);
      } catch (e) {
        console.log(e);
        return;
      }

      // Subscription Cleanup
      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged);
          provider.removeListener('chainChanged', handleChainChanged);
          provider.removeListener('disconnect', handleDisconnect);
        }
      };
    }
  }, [provider, disconnect]);

  return {
    provider,
    web3Provider,
    walletAddress,
    network,
    connect,
    disconnect,
  } as Web3ProviderState;
};
