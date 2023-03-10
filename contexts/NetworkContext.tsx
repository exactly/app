import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { Chain, useNetwork } from 'wagmi';
import * as wagmiChains from 'wagmi/chains';
import Router, { useRouter } from 'next/router';

import { supportedChains, defaultChain } from 'utils/client';
import usePreviousValue from 'hooks/usePreviousValue';
import AccountDataContext from './AccountDataContext';

function isSupported(id?: number): boolean {
  return Boolean(id && supportedChains.find((c) => c.id === id));
}

function getQueryParam(key: string): string | undefined {
  if (typeof window !== 'undefined' && 'URLSearchParams' in window) {
    const proxy = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop as string),
    });
    return (proxy as unknown as { [key: string]: string })[key];
  }
}

type ContextValues = {
  displayNetwork: Chain;
  setDisplayNetwork: (c: Chain) => void;
};

const NetworkContext = createContext<ContextValues | null>(null);

export const NetworkContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { pathname } = useRouter();
  const { chain } = useNetwork();
  const [displayNetwork, setDisplayNetwork] = useState<Chain>(defaultChain ?? wagmiChains.mainnet);
  const [loading, setLoading] = useState(true);
  const first = useRef(true);
  const previousChain = usePreviousValue(chain);
  const { resetAccountData } = useContext(AccountDataContext);

  useEffect(() => {
    setLoading(false);
    if (first.current) {
      // HACK: Follow the url for 3s
      setTimeout(() => (first.current = false), 3000);

      const n = getQueryParam('n');
      const queryChain = typeof n === 'string' ? wagmiChains[n as keyof typeof wagmiChains] : undefined;
      if (isSupported(queryChain?.id) && queryChain) {
        return setDisplayNetwork(queryChain);
      }
    }

    if (previousChain && chain && isSupported(chain.id) && previousChain.id !== chain.id) {
      resetAccountData();
      return setDisplayNetwork(chain);
    }
  }, [previousChain, chain, displayNetwork, resetAccountData]);

  useEffect(() => {
    if (first.current) {
      return;
    }

    const network = { [wagmiChains.mainnet.id]: 'mainnet' }[displayNetwork.id] ?? displayNetwork.network;
    Router.replace({ query: { ...Router.query, n: network } });
  }, [displayNetwork, pathname]);

  const value: ContextValues = {
    displayNetwork,
    setDisplayNetwork,
  };

  return <NetworkContext.Provider value={value}>{loading ? null : children}</NetworkContext.Provider>;
};

export function useNetworkContext() {
  const ctx = useContext(NetworkContext);
  if (!ctx) {
    throw new Error('Using NetworkContext outside of provider');
  }
  return ctx;
}

export default NetworkContext;
