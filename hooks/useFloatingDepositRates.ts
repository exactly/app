import { useEffect, useMemo, useState } from 'react';
import { floatingDepositRates } from '@exactly/lib';
import { Address, formatEther, isAddress, zeroAddress } from 'viem';
import { usePublicClient } from 'wagmi';
import { optimismSepolia, optimism, base, baseSepolia } from 'wagmi/chains';

import { useRatePreviewerSnapshot } from 'types/abi';
import { useWeb3 } from './useWeb3';
import optimismRatePreviewer from '@exactly/protocol/deployments/optimism/RatePreviewer.json' assert { type: 'json' };
import sepoliaRatePreviewer from '@exactly/protocol/deployments/op-sepolia/RatePreviewer.json' assert { type: 'json' };
import baseRatePreviewer from '@exactly/protocol/deployments/base/RatePreviewer.json' assert { type: 'json' };
import baseSepoliaRatePreviewer from '@exactly/protocol/deployments/base-sepolia/RatePreviewer.json' assert { type: 'json' };

type MarketSnapshot = Parameters<typeof floatingDepositRates>[0][number];
type RatePreviewerSnapshot = Omit<
  MarketSnapshot,
  'lastAccumulatorAccrual' | 'lastFloatingDebtUpdate' | 'maxFuturePools'
> & {
  lastAccumulatorAccrual: bigint | number;
  lastFloatingDebtUpdate: bigint | number;
  maxFuturePools: bigint | number;
};

const ratePreviewerAddress = {
  [optimismSepolia.id]: sepoliaRatePreviewer.address,
  [optimism.id]: optimismRatePreviewer.address,
  [base.id]: baseRatePreviewer.address,
  [baseSepolia.id]: baseSepoliaRatePreviewer.address,
} as const;

function useBlockTimestamp(chainId: number, enabled: boolean, snapshot: readonly RatePreviewerSnapshot[] | undefined) {
  const publicClient = usePublicClient({ chainId });
  const [timestamp, setTimestamp] = useState<number>();

  useEffect(() => {
    let cancelled = false;
    setTimestamp(undefined);

    if (!enabled || !publicClient) return;

    publicClient
      .getBlock()
      .then((block) => {
        if (!cancelled) setTimestamp(Number(block.timestamp));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [chainId, enabled, publicClient, snapshot]);

  return timestamp;
}

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
  const { chain } = useWeb3();
  const address = ratePreviewerAddress[chain.id as keyof typeof ratePreviewerAddress] as Address | undefined;
  const shouldRead = enabled && Boolean(address && isAddress(address));

  const {
    data: snapshot,
    isFetching,
    isLoading,
  } = useRatePreviewerSnapshot({
    address: address ?? zeroAddress,
    chainId: chain.id,
    enabled: shouldRead,
    staleTime: 5_000,
  });

  const blockTimestamp = useBlockTimestamp(chain.id, shouldRead && Boolean(snapshot), snapshot);

  const data = useMemo(() => {
    if (!snapshot) return undefined;

    try {
      const timestamp = blockTimestamp ?? Math.floor(Date.now() / 1_000); // fallback until onchain timestamp loads
      return Object.fromEntries(
        floatingDepositRates(snapshot.map(normalizeSnapshot), timestamp).map(({ market, rate }) => [
          market.toLowerCase(),
          Number(formatEther(rate)),
        ]),
      );
    } catch {
      return undefined;
    }
  }, [snapshot, blockTimestamp]);

  return {
    data,
    isFetching,
    isLoading: shouldRead && isLoading,
  };
}
