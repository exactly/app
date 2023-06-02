import { useCallback } from 'react';
import { useProvider } from 'wagmi';

export default function useIsContract() {
  const provider = useProvider();

  return useCallback(
    async (address: string) => {
      const code = await provider.getCode(address);
      return code !== '0x';
    },
    [provider],
  );
}
