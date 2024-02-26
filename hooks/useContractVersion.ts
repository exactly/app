import { Address } from 'viem';
import { useCallback } from 'react';
import { usePublicClient } from 'wagmi';

export default function useContractVersion() {
  const publicClient = usePublicClient();

  return useCallback(
    async (address: Address) => {
      try {
        const version = await publicClient.readContract({
          address,
          abi: [
            {
              inputs: [],
              name: 'version',
              outputs: [{ internalType: 'string', name: '', type: 'string' }],
              stateMutability: 'pure',
              type: 'function',
            },
          ],
          functionName: 'version',
        });

        return version;
      } catch (e: unknown) {
        return '1';
      }
    },
    [publicClient],
  );
}
