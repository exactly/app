import { Address } from 'viem';
import { useCallback } from 'react';
import { usePublicClient } from 'wagmi';

import { erc20ABI } from 'types/abi';

export default function useIsPermit() {
  const publicClient = usePublicClient();

  return useCallback(
    async (address: Address) => {
      try {
        await publicClient.readContract({
          address,
          abi: erc20ABI,
          functionName: 'DOMAIN_SEPARATOR',
        });

        return true;
      } catch (e: unknown) {
        return false;
      }
    },
    [publicClient],
  );
}
