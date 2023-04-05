import React, { createContext, useContext, useState, useEffect } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { Chain, useNetwork } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { isSupported } from 'utils/chain';
import usePreviousValue from 'hooks/usePreviousValue';

type ContextValues = {
  displayNetwork: Chain;
  setDisplayNetwork: (c: Chain) => void;
};

const NetworkContext = createContext<ContextValues | null>(null);

type ProviderProps = {
  initial: Chain;
};

export const NetworkContextProvider: FC<PropsWithChildren<ProviderProps>> = ({ initial, children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams();
  const { chain } = useNetwork();
  const [displayNetwork, setDisplayNetwork] = useState<Chain>(initial);
  const previousChain = usePreviousValue(chain);

  useEffect(() => {
    if (previousChain && chain && isSupported(chain.id) && previousChain.id !== chain.id) {
      return setDisplayNetwork(chain);
    }
  }, [previousChain, chain, displayNetwork]);

  useEffect(() => {
    const network = { [mainnet.id]: 'mainnet' }[displayNetwork.id] ?? displayNetwork.network;
    const q = new URLSearchParams(query);
    q.set('n', network);
    router.replace(`${pathname}?${q.toString()}`);
  }, [displayNetwork, pathname, query, router]);

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
