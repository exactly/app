import type { FC, PropsWithChildren } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePreviewerStaking } from 'hooks/useStakingPreviewer';
import useAccountData from 'hooks/useAccountData';
import { useEXAPrice } from 'hooks/useEXA';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';
import getVouchersPrice from 'utils/getVouchersPrice';

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

export type Rewards = {
  claimable: bigint;
  claimed: bigint;
  earned: bigint;
  finishAt: bigint;
  rate: bigint;
  reward: `0x${string}`;
  symbol: string;
};

type ContextValues = {
  balance: bigint | undefined;
  parameters: Parameters | undefined;
  rewards: readonly Rewards[] | undefined;
  start: bigint | undefined;
  time: bigint | undefined;
  totalAssets: bigint | undefined;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => void;
  totalClaimable: bigint;
  totalClaimed: bigint;
  totalEarned: bigint;
  claimableTokens: Record<string, bigint>;
  claimedTokens: Record<string, bigint>;
  earnedTokens: Record<string, bigint>;
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
        | 'claimableTokens'
        | 'claimedTokens'
        | 'earnedTokens'
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
          claimableTokens: {} as Record<string, bigint>,
          claimedTokens: {} as Record<string, bigint>,
          earnedTokens: {} as Record<string, bigint>,
          penalty: 0n,
        };
      }

      const result = rewards.reduce(
        (acc, item) => {
          let amountClaimable,
            amountClaimed,
            amountEarned = 0n;
          if (item.symbol === 'EXA') {
            amountClaimable = (item.claimable * (exaPrice || 1n * WAD)) / WAD;
            amountClaimed = (item.claimed * (exaPrice || 1n * WAD)) / WAD;
            amountEarned = (item.earned * (exaPrice || 1n * WAD)) / WAD;
          } else {
            if (!accountData) return acc;
            const r = accountData?.find((a) => a.asset === item.reward || a.market === item.reward);

            const usdPrice = getVouchersPrice(accountData, item.symbol);
            const decimals = r?.decimals || 18;
            const decimalWAD = 10n ** BigInt(decimals);

            amountClaimable = (item.claimable * usdPrice) / decimalWAD;
            amountClaimed = (item.claimed * usdPrice) / decimalWAD;
            amountEarned = (item.earned * usdPrice) / decimalWAD;
          }

          const symbol = item.symbol;
          acc.claimableTokens[symbol] = (acc.claimableTokens[symbol] || 0n) + amountClaimable;
          acc.claimedTokens[symbol] = (acc.claimedTokens[symbol] || 0n) + amountClaimed;
          acc.earnedTokens[symbol] = (acc.earnedTokens[symbol] || 0n) + amountEarned;

          acc.totalClaimable += amountClaimable;
          acc.totalClaimed += amountClaimed;
          acc.totalEarned += amountEarned;

          if (item.rate > 0n) acc.rewardsTokens.push(symbol);
          return acc;
        },
        {
          totalClaimable: 0n,
          totalClaimed: 0n,
          totalEarned: 0n,
          claimableTokens: {} as Record<string, bigint>,
          claimedTokens: {} as Record<string, bigint>,
          earnedTokens: {} as Record<string, bigint>,
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
        claimableTokens: result.claimableTokens,
        claimedTokens: result.claimedTokens,
        earnedTokens: result.earnedTokens,
        penalty,
      };
    },
    [accountData, exaPrice, state],
  );

  const {
    totalClaimable,
    totalClaimed,
    totalEarned,
    rewardsTokens,
    penalty,
    claimableTokens,
    claimedTokens,
    earnedTokens,
  } = useMemo(() => calculateRewards([...(state?.rewards || [])]), [calculateRewards, state?.rewards]);

  const value = useMemo(() => {
    const { balance, parameters, rewards, start, time, totalAssets } = state || {};
    return {
      balance,
      parameters,
      rewards,
      start,
      time,
      totalAssets,
      isLoading,
      isFetching,
      refetch,
      totalClaimable,
      totalClaimed,
      totalEarned,
      rewardsTokens,
      penalty,
      claimableTokens,
      claimedTokens,
      earnedTokens,
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
    claimableTokens,
    claimedTokens,
    earnedTokens,
    calculateRewards,
  ]);

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
