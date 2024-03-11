import { useCallback } from 'react';
import { pad, trim } from 'viem';
import { Address, usePublicClient } from 'wagmi';
import useAccountData from 'hooks/useAccountData';
import useSignPermit from 'hooks/useSignPermit';
import { useWeb3 } from 'hooks/useWeb3';
import useMarket from 'hooks/useMarket';

export default function useMarketPermit(marketSymbol: string) {
  const { walletAddress } = useWeb3();
  const publicClient = usePublicClient();
  const { marketAccount } = useAccountData(marketSymbol);
  const market = useMarket(marketAccount?.market);
  const signPermit = useSignPermit();

  return useCallback(
    async (params: { spender: Address; value: bigint; duration: number }) => {
      if (!market || !walletAddress) return;
      const implementation = await publicClient.getStorageAt({
        address: market.address,
        slot: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',
      });
      if (!implementation) return;

      return signPermit({
        ...params,
        verifyingContract: {
          ...market,
          address: pad(trim(implementation), { size: 20 }),
        },
      });
    },
    [market, publicClient, signPermit, walletAddress],
  );
}
