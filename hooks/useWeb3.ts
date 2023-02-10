import { Chain, useAccount, useNetwork, useSwitchNetwork } from 'wagmi';
import { useEffect } from 'react';
import * as chains from 'wagmi/chains';
import { defaultChain, supportedChains } from 'utils/client';
import useDebounce from './useDebounce';
import useRouter from './useRouter';

type Web3 = {
  isConnected: boolean;
  walletAddress?: `0x${string}`;
  chains: Chain[];
  chain?: Chain;
};

export const useWeb3 = (): Web3 => {
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

  const walletAddress = useDebounce(address, 50);
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
