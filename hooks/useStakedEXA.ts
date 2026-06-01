import { formatEther, parseEther, zeroAddress } from 'viem';
import { WAD, lnWad, expWad } from '@exactly/lib';
import { useCallback, useMemo } from 'react';
import { stakingPreviewerAddress, useReadStakingPreviewerStaking } from 'generated/wagmi';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';

const stakingPreviewerChainId = Object.keys(stakingPreviewerAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof stakingPreviewerAddress => chainId === defaultChain.id);

export const useStakedEXAChart = () => {
  const { account } = useReadOnly();
  const { data } = useReadStakingPreviewerStaking({
    chainId: stakingPreviewerChainId,
    args: [account ?? zeroAddress],
    query: { enabled: stakingPreviewerChainId !== undefined, staleTime: 5_000 },
  });
  const start = data?.start;
  const balance = data?.balance;
  const parameters = data?.parameters;

  const calculateValue = useCallback(
    (
      time: bigint,
      minTime: bigint,
      refTime: bigint,
      penaltyGrowth: bigint,
      excessFactor: bigint,
      penaltyThreshold: bigint,
    ): bigint => {
      if (time <= minTime) return 0n;
      if (time >= refTime) {
        return ((WAD - excessFactor) * ((refTime * WAD) / time)) / WAD + excessFactor;
      }

      const penalties = expWad((penaltyGrowth * lnWad(((time - minTime) * WAD) / (refTime - minTime))) / WAD);

      const value = ((WAD - penaltyThreshold) * penalties) / WAD + penaltyThreshold;

      return value < WAD ? value : WAD;
    },
    [],
  );

  const points = useMemo(() => {
    if (parameters !== undefined && start !== undefined && balance !== undefined) {
      const now = parseEther(Math.floor(Date.now() / 1000).toString());
      const minTime = parameters.minTime * WAD;
      const avgStart = start > 0n ? start : now;
      const cliff = avgStart + minTime;
      const refTime = parameters.refTime * WAD;
      const optimalStakeTime = avgStart + refTime;
      const tailTime = (refTime * 25n) / 100n; //25% of refTime
      const extra = now > optimalStakeTime ? now - optimalStakeTime + tailTime : tailTime;
      const endTime = optimalStakeTime + extra;
      const numberOfTicks = 100n * WAD;
      const interval = ((endTime - avgStart) * WAD) / numberOfTicks;

      const mainPoints = [
        now,
        avgStart,
        cliff - WAD,
        cliff,
        cliff + WAD,
        optimalStakeTime - WAD,
        optimalStakeTime,
        optimalStakeTime + WAD,
        endTime,
      ];

      const dataPoints = [];

      for (let i = 1; i <= Number(numberOfTicks / WAD); i++) {
        const timestamp = avgStart + (interval * parseEther(i.toString())) / WAD;

        const time = timestamp - avgStart;

        const value = calculateValue(
          time,
          minTime,
          refTime,
          parameters.penaltyGrowth,
          parameters.excessFactor,
          parameters.penaltyThreshold,
        );

        dataPoints.push({
          timestamp: Number(formatEther(timestamp)),
          value: Number(formatEther(value)),
        });
      }

      for (let i = 0; i < mainPoints.length; i++) {
        const timestamp = mainPoints[i];
        const time = timestamp - avgStart;

        const value = calculateValue(
          time,
          minTime,
          refTime,
          parameters.penaltyGrowth,
          parameters.excessFactor,
          parameters.penaltyThreshold,
        );

        dataPoints.push({
          timestamp: Number(formatEther(timestamp)),
          value: Number(value) / 1e18,
        });
      }

      return dataPoints.sort((a, b) => a.timestamp - b.timestamp);
    }
    return [];
  }, [parameters, start, balance, calculateValue]);

  return points;
};
