import { Chain, useAccount } from 'wagmi';
import { supportedChains } from 'utils/client';
import useDebounce from './useDebounce';
import { useNetworkContext } from 'contexts/NetworkContext';

type Web3 = {
  isConnected: boolean;
  walletAddress?: `0x${string}`;
  chains: Chain[];
  chain: Chain;
};

export const useWeb3 = (): Web3 => {
  const { address } = useAccount();
  const { displayNetwork } = useNetworkContext();

  const walletAddress = useDebounce(address, 50);
  return {
    isConnected: !!walletAddress,
    walletAddress,
    chains: supportedChains,
    chain: displayNetwork,
  };
};
