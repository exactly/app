import { useCallback } from 'react';
import { pad, trim, type Address } from 'viem';
import { usePublicClient } from 'wagmi';
import useAccountData from 'hooks/useAccountData';
import useSignPermit from 'hooks/useSignPermit';

export default function useMarketPermit(marketSymbol: string) {
  const publicClient = usePublicClient();
  const { marketAccount } = useAccountData(marketSymbol);
  const signPermit = useSignPermit();

  return useCallback(
    async (params: { spender: Address; value: bigint; duration: number }) => {
      if (!marketAccount?.market || !publicClient) return;
      const implementation = await publicClient.getStorageAt({
        address: marketAccount.market,
        slot: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
      });
      if (!implementation) return;

      return signPermit({
        ...params,
        verifyingContract: pad(trim(implementation), { size: 20 }),
        noncesFrom: marketAccount.market,
      });
    },
    [marketAccount?.market, publicClient, signPermit],
  );
}
