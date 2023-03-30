'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { Chain, useNetwork } from 'wagmi';
import * as wagmiChains from 'wagmi/chains';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

import { supportedChains, defaultChain } from 'utils/client';
import usePreviousValue from 'hooks/usePreviousValue';
import { getQueryParam } from 'utils/getQueryParam';

function isSupported(id?: number): boolean {
  return Boolean(id && supportedChains.find((c) => c.id === id));
}

type ContextValues = {
  displayNetwork: Chain;
  setDisplayNetwork: (c: Chain) => void;
};

const NetworkContext = createContext<ContextValues | null>(null);

export const NetworkContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const pathname = usePathname();
  const query = useSearchParams();
  const router = useRouter();
  const { chain } = useNetwork();
  const [first, setFirst] = useState(true);
  const [displayNetwork, setDisplayNetwork] = useState<Chain>(() => {
    const n = getQueryParam('n');
    const queryChain = typeof n === 'string' ? wagmiChains[n as keyof typeof wagmiChains] : undefined;
    if (isSupported(queryChain?.id) && queryChain) {
      return queryChain;
    }

    return defaultChain ?? wagmiChains.mainnet;
  });
  const previousChain = usePreviousValue(chain);

  useEffect(() => {
    if (first) {
      return setFirst(false);
    }

    if (previousChain && chain && isSupported(chain.id) && previousChain.id !== chain.id) {
      return setDisplayNetwork(chain);
    }
  }, [previousChain, chain, displayNetwork, first]);

  useEffect(() => {
    if (first) {
      return;
    }

    const network = { [wagmiChains.mainnet.id]: 'mainnet' }[displayNetwork.id] ?? displayNetwork.network;
    const searchParams = new URLSearchParams(query);
    searchParams.set('n', network);

    router.replace(pathname + '?' + searchParams.toString());
  }, [displayNetwork, pathname, query, router, first]);

  const value: ContextValues = {
    displayNetwork,
    setDisplayNetwork,
  };

  return <NetworkContext.Provider value={value}>{first ? null : children}</NetworkContext.Provider>;
};

export function useNetworkContext() {
  const ctx = useContext(NetworkContext);
  if (!ctx) {
    throw new Error('Using NetworkContext outside of provider');
  }
  return ctx;
}

export default NetworkContext;
