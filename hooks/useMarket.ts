import { useMemo } from 'react';
import { Address, usePublicClient, useWalletClient } from 'wagmi';
import { marketABI } from 'types/abi';
import { getContract } from '@wagmi/core';
import { Market } from 'types/contracts';
import { useWeb3 } from './useWeb3';

export default (address?: Address, readOnly?: boolean): Market | undefined => {
  const { chain } = useWeb3();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const marketContract = useMemo(() => {
    if (!address) return;
    if (!walletClient && !readOnly) return;

    const contract = getContract({
      chainId: chain.id,
      address,
      abi: marketABI,
      ...(readOnly || !walletClient ? { publicClient } : { walletClient }),
    });

    return contract;
  }, [address, walletClient, chain.id, publicClient, readOnly]);

  return marketContract;
};
