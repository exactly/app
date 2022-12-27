import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import * as chains from 'wagmi/chains';
import { defaultChain, supportedChains } from 'utils/client';
import useDebounce from './useDebounce';

export const useWeb3 = () => {
  const { switchNetwork } = useSwitchNetwork();
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { query } = useRouter();
  const queryChain = typeof query.n === 'string' ? chains[query.n as keyof typeof chains] : undefined;
  const isQueryChainSupported = queryChain && supportedChains.find(({ id }) => queryChain?.id === id);

  useEffect(() => {
    if (switchNetwork && isQueryChainSupported && chain && chain.id !== queryChain.id) {
      switchNetwork(queryChain.id);
    }
  }, [chain, isQueryChainSupported, queryChain?.id, switchNetwork]);

  const walletAddress = useDebounce(address);
  return {
    isConnected: !!walletAddress,
    walletAddress,
    chains: supportedChains,
    chain:
      walletAddress && supportedChains.find(({ id }) => chain?.id === id)
        ? chain
        : isQueryChainSupported
        ? queryChain
        : defaultChain,
  };
};
