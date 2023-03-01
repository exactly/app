import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { Chain, useNetwork } from 'wagmi';
import * as wagmiChains from 'wagmi/chains';
import { useRouter } from 'next/router';

import { supportedChains, defaultChain } from 'utils/client';

function isSupported(id?: number): boolean {
  if (!id) return false;
  return Boolean(supportedChains.find((c) => c.id === id));
}

type ContextValues = {
  displayNetwork: Chain;
  setDisplayNetwork: (c: Chain) => void;
};

const NetworkContext = createContext<ContextValues | null>(null);

export const NetworkContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const { chain } = useNetwork();
  const {
    query: { n },
    replace,
  } = useRouter();
  const [displayNetwork, setDisplayNetwork] = useState<Chain>(defaultChain ?? wagmiChains.mainnet);

  const first = useRef(true);

  useEffect(() => {
    console.log('effect 1');
    if (first.current) {
      if (!n) return;
      first.current = false;
      const queryChain = typeof n === 'string' ? wagmiChains[n as keyof typeof wagmiChains] : undefined;
      if (isSupported(queryChain?.id) && queryChain) {
        return setDisplayNetwork(queryChain);
      }
    }

    if (chain && isSupported(chain.id)) {
      return setDisplayNetwork(chain);
    }
  }, [n, chain, displayNetwork]);

  useEffect(() => {
    if (first.current) {
      return;
    }

    console.log('effect 2');
    const network = { [wagmiChains.mainnet.id]: 'mainnet' }[displayNetwork.id] ?? displayNetwork.network;
    replace({ query: { n: network } });
  }, [displayNetwork]);

  const value: ContextValues = {
    displayNetwork,
    setDisplayNetwork,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export function useNetworkContext() {
  const ctx = useContext(NetworkContext);
  if (!ctx) {
    throw new Error('Using NetworkContext outside of provider');
  }
  return ctx;
}

export default NetworkContext;
