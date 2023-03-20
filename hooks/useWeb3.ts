import { Chain, useAccount } from 'wagmi';
import { supportedChains } from 'utils/client';
import useDebounce from './useDebounce';
import { useNetworkContext } from 'contexts/NetworkContext';
import { getQueryParam } from 'utils/getQueryParam';
import { useMemo } from 'react';

type Web3 = {
  isConnected: boolean;
  walletAddress?: `0x${string}`;
  chains: Chain[];
  chain: Chain;
};

const isValidAddress = (address: string | undefined) => {
  return address && /^(0x){1}[0-9a-fA-F]{40}$/i.test(address);
};

export const useWeb3 = (): Web3 => {
  const { address } = useAccount();
  const { displayNetwork } = useNetworkContext();

  const currentAddress: `0x${string}` | undefined = useMemo(() => {
    const param = getQueryParam('account');
    const account = isValidAddress(param) ? (param as `0x${string}`) : undefined;
    return account || address;
  }, [address]);

  const walletAddress = useDebounce(currentAddress, 50);
  return {
    isConnected: !!walletAddress,
    walletAddress,
    chains: supportedChains,
    chain: displayNetwork,
  };
};
