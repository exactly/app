import { Address } from 'viem';
import { useCallback } from 'react';
import { usePublicClient } from 'wagmi';

export default function useIsContract() {
  const publicClient = usePublicClient();

  return useCallback((address: Address) => publicClient.getBytecode({ address }).then(Boolean), [publicClient]);
}
