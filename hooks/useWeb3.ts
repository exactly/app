import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import * as chains from 'wagmi/chains';
import { supportedChains } from 'utils/client';
import useDebounce from './useDebounce';

export const useWeb3 = () => {
  const { switchNetwork } = useSwitchNetwork();
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { query } = useRouter();
  const queryChain = typeof query.n === 'string' ? chains[query.n as keyof typeof chains] : undefined;

  useEffect(() => {
    if (
      switchNetwork &&
      chain &&
      queryChain &&
      chain.id !== queryChain.id &&
      supportedChains.find(({ id }) => queryChain?.id === id)
    ) {
      switchNetwork(queryChain.id);
    }
  }, [chain, queryChain, switchNetwork]);

  const walletAddress = useDebounce(address);
  return {
    isConnected: !!walletAddress,
    walletAddress,
    chains: supportedChains,
    chain:
      walletAddress && supportedChains.find(({ id }) => chain?.id === id)
        ? chain
        : queryChain ?? chains[process.env.NEXT_PUBLIC_NETWORK as keyof typeof chains],
  };
};
