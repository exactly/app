import { useMemo } from 'react';
import { floatingDepositRates } from '@exactly/lib';
import { formatEther } from 'viem';
import { useBlock } from 'wagmi';

import { ratePreviewerAddress, useReadRatePreviewerSnapshot } from 'generated/wagmi';
import { defaultChain } from 'utils/client';

type MarketSnapshot = Parameters<typeof floatingDepositRates>[0][number];
type RatePreviewerSnapshot = Omit<
  MarketSnapshot,
  'lastAccumulatorAccrual' | 'lastFloatingDebtUpdate' | 'maxFuturePools'
> & {
  lastAccumulatorAccrual: bigint | number;
  lastFloatingDebtUpdate: bigint | number;
  maxFuturePools: bigint | number;
};

const normalizeSnapshot = (snapshot: RatePreviewerSnapshot): MarketSnapshot => ({
  ...snapshot,
  lastAccumulatorAccrual: Number(snapshot.lastAccumulatorAccrual),
  lastFloatingDebtUpdate: Number(snapshot.lastFloatingDebtUpdate),
  maxFuturePools: Number(snapshot.maxFuturePools),
});

export default function useFloatingDepositRates(enabled = true): {
  data: Record<string, number> | undefined;
  isFetching: boolean;
  isLoading: boolean;
} {
  const ratePreviewerChainId = Object.keys(ratePreviewerAddress)
    .map(Number)
    .find((chainId): chainId is keyof typeof ratePreviewerAddress => chainId === defaultChain.id);
  const shouldRead = enabled && ratePreviewerChainId !== undefined;

  const {
    data: snapshot,
    isFetching,
    isLoading,
  } = useReadRatePreviewerSnapshot({
    chainId: ratePreviewerChainId,
    query: { enabled: shouldRead, staleTime: 5_000 },
  });
  const { data: block } = useBlock({
    chainId: ratePreviewerChainId,
    query: { enabled: shouldRead && Boolean(snapshot) },
  });

  const data = useMemo(() => {
    if (!snapshot) return undefined;

    try {
      const timestamp = block ? Number(block.timestamp) : Math.floor(Date.now() / 1_000);
      return Object.fromEntries(
        floatingDepositRates(snapshot.map(normalizeSnapshot), timestamp).map(({ market, rate }) => [
          market.toLowerCase(),
          Number(formatEther(rate)),
        ]),
      );
    } catch {
      return undefined;
    }
  }, [snapshot, block]);

  return {
    data,
    isFetching,
    isLoading: shouldRead && isLoading,
  };
}
