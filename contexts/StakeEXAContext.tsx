import type { FC, PropsWithChildren } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePreviewerStaking } from 'hooks/useStakingPreviewer';
import useAccountData from 'hooks/useAccountData';
import { useEXAPrice } from 'hooks/useEXA';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

type Parameters = {
  asset: `0x${string}`;
  duration: number;
  excessFactor: bigint;
  market: `0x${string}`;
  minTime: bigint;
  penaltyGrowth: bigint;
  penaltyThreshold: bigint;
  provider: `0x${string}`;
  providerRatio: bigint;
  refTime: bigint;
  savings: `0x${string}`;
};

type Rewards = {
  claimable: bigint;
  claimed: bigint;
  earned: bigint;
  finishAt: bigint;
  rate: bigint;
  reward: `0x${string}`;
  symbol: string;
};

type ContextValues = {
  balance: bigint;
  parameters: Parameters;
  rewards: readonly Rewards[];
  start: bigint;
  time: bigint;
  totalAssets: bigint;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
  totalClaimable: bigint;
  totalClaimed: bigint;
  totalEarned: bigint;
  rewardsTokens: string[];
  penalty: bigint;
  calculateRewards: (rewards: Rewards[]) => {
    totalClaimable: bigint;
    totalClaimed: bigint;
    totalEarned: bigint;
    rewardsTokens: string[];
    penalty: bigint;
  };
};

const StakeEXAContext = createContext<ContextValues | null>(null);

export const StakeEXAProvider: FC<PropsWithChildren> = ({ children }) => {
  const { isLoading, isFetching, data: _data, refetch: _refetch } = usePreviewerStaking();

  const { accountData } = useAccountData();
  const exaPrice = useEXAPrice();

  const [state, setState] = useState<
    | Omit<
        ContextValues,
        | 'isLoading'
        | 'isFetching'
        | 'refetch'
        | 'totalClaimable'
        | 'totalClaimed'
        | 'totalEarned'
        | 'rewardsTokens'
        | 'penalty'
        | 'calculateRewards'
      >
    | undefined
  >(_data);

  const refetch = useCallback(() => {
    _refetch().then((result) => {
      setState(result.data);
    });
  }, [_refetch]);

  useEffect(() => {
    setState(_data);
  }, [_data]);

  const calculateRewards = useCallback(
    (rewards: Rewards[]) => {
      if (!state) {
        return {
          totalClaimable: 0n,
          totalClaimed: 0n,
          totalEarned: 0n,
          rewardsTokens: [] as string[],
          penalty: 0n,
        };
      }

      const result = rewards.reduce(
        (acc, item) => {
          if (item.symbol === 'EXA') {
            acc.totalClaimable += (item.claimable * (exaPrice || 1n * WAD)) / WAD;
            acc.totalClaimed += (item.claimed * (exaPrice || 1n * WAD)) / WAD;
            acc.totalEarned += (item.earned * (exaPrice || 1n * WAD)) / WAD;
          } else {
            const r = accountData?.find((a) => a.asset === item.reward);
            const usdPrice = r?.usdPrice || 0n;
            const decimals = r?.decimals || 18;
            const decimalWAD = 10n ** BigInt(decimals);

            acc.totalClaimable += (item.claimable * usdPrice) / decimalWAD;
            acc.totalClaimed += (item.claimed * usdPrice) / decimalWAD;
            acc.totalEarned += (item.earned * usdPrice) / decimalWAD;
          }
          if (item.rate > 0n) acc.rewardsTokens.push(item.symbol);
          return acc;
        },
        {
          totalClaimable: 0n,
          totalClaimed: 0n,
          totalEarned: 0n,
          rewardsTokens: [] as string[],
        },
      );

      const penalty =
        result.totalEarned > 0n
          ? ((result.totalEarned - (result.totalClaimable + result.totalClaimed)) * WAD) / result.totalEarned
          : 0n;

      return {
        totalClaimable: result.totalClaimable,
        totalClaimed: result.totalClaimed,
        totalEarned: result.totalEarned,
        rewardsTokens: result.rewardsTokens,
        penalty,
      };
    },
    [accountData, exaPrice, state],
  );

  const { totalClaimable, totalClaimed, totalEarned, rewardsTokens, penalty } = useMemo(
    () => calculateRewards([...(state?.rewards || [])]),
    [calculateRewards, state?.rewards],
  );

  const value = useMemo(() => {
    if (!state) {
      return null;
    }
    return {
      ...state,
      isLoading,
      isFetching,
      refetch,
      totalClaimable,
      totalClaimed,
      totalEarned,
      rewardsTokens,
      penalty,
      calculateRewards,
    };
  }, [
    state,
    isLoading,
    isFetching,
    refetch,
    totalClaimable,
    totalClaimed,
    totalEarned,
    rewardsTokens,
    penalty,
    calculateRewards,
  ]);

  if (isLoading || !value) {
    return <div>Loading...</div>;
  }

  return <StakeEXAContext.Provider value={value}>{children}</StakeEXAContext.Provider>;
};

export function useStakeEXA() {
  const ctx = useContext(StakeEXAContext);

  if (!ctx) {
    throw new Error('Using StakeEXAContext outside of provider');
  }
  return ctx;
}

export default StakeEXAContext;
