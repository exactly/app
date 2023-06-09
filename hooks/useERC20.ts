import { useMemo } from 'react';
import { Address, useWalletClient } from 'wagmi';
import { getContract } from '@wagmi/core';
import { erc20ABI } from 'types/abi';
import { ERC20 } from 'types/contracts';
import { useWeb3 } from './useWeb3';

export default (address?: Address): ERC20 | undefined => {
  const { chain } = useWeb3();
  const { data: walletClient } = useWalletClient();

  return useMemo(() => {
    if (!walletClient || !address) return;

    const contract = getContract({
      chainId: chain.id,
      address,
      abi: erc20ABI,
      walletClient,
    });

    return contract;
  }, [address, chain, walletClient]);
};
