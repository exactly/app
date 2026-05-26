import { useMemo } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { getContract, type Address } from 'viem';
import { erc20Abi } from 'generated/wagmi';
import { ERC20 } from 'types/contracts';
import { defaultChain } from 'utils/client';

export default (address?: Address, chainId?: number): ERC20 | undefined => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: chainId || defaultChain.id });

  return useMemo(() => {
    if (!walletClient || !publicClient || !address) return;

    const contract = getContract({
      address,
      abi: erc20Abi,
      client: { public: publicClient, wallet: walletClient },
    });

    return contract;
  }, [address, publicClient, walletClient]);
};
