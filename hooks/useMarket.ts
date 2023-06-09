import { useMemo } from 'react';
import { Address, useWalletClient } from 'wagmi';
import { marketABI } from 'types/abi';
import { getContract } from '@wagmi/core';
import { Market } from 'types/contracts';
import { useWeb3 } from './useWeb3';

export default (address?: Address): Market | undefined => {
  const { chain } = useWeb3();
  const { data: walletClient } = useWalletClient();

  const marketContract = useMemo(() => {
    if (!address || !walletClient) return;

    const contract = getContract({
      chainId: chain.id,
      address,
      abi: marketABI,
      walletClient,
    });

    return contract;
  }, [chain.id, address, walletClient]);

  return marketContract;
};
