import { type Address } from 'viem';
import { useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { isE2E } from 'utils/client';

export default function useIsContract() {
  const publicClient = usePublicClient();
  return useCallback(
    (address: Address) =>
      isE2E
        ? Promise.resolve(false)
        : publicClient
          ? publicClient.getBytecode({ address }).then((bytecode) => Boolean(bytecode && bytecode !== '0x'))
          : Promise.resolve(false),
    [publicClient],
  );
}
