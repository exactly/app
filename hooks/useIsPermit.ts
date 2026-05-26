import { Address } from 'viem';
import { useCallback } from 'react';
import { usePublicClient } from 'wagmi';

import { erc20Abi } from 'generated/wagmi';

export default function useIsPermit() {
  const publicClient = usePublicClient();

  return useCallback(
    async (address: Address) => {
      if (!publicClient) return false;
      try {
        await publicClient.readContract({
          address,
          abi: erc20Abi,
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
