import { useMemo } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { getContract, type Address } from 'viem';
import { marketAbi } from 'generated/wagmi';
import { Market } from 'types/contracts';

function useMarket(address?: Address): Market | undefined {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const marketContract = useMemo(() => {
    if (!address) return;
    if (!walletClient || !publicClient) return;

    const contract = getContract({
      address,
      abi: marketAbi,
      client: { public: publicClient, wallet: walletClient },
    });

    return contract;
  }, [address, walletClient, publicClient]);

  return marketContract;
}

export default useMarket;
