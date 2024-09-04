import { stakedExaABI, useStakedExaBalanceOf } from 'types/abi';

import useContract from './useContract';
import { formatEther, parseEther, zeroAddress } from 'viem';
import { useWeb3 } from './useWeb3';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';
import lnWad from '@exactly/lib/esm/fixed-point-math/lnWad';
import expWad from '@exactly/lib/esm/fixed-point-math/expWad';
import { useCallback, useMemo } from 'react';
import { useStakeEXA } from 'contexts/StakeEXAContext';

export const useStakedEXA = () => {
  return useContract('stEXA', stakedExaABI);
};

export const useStakedEXABalance = () => {
  const { chain, walletAddress } = useWeb3();
  const stEXA = useStakedEXA();

  return useStakedExaBalanceOf({
    chainId: chain.id,
    address: stEXA?.address,
    args: [walletAddress ?? zeroAddress],
    staleTime: 30_000,
  });
};

export const useStakedEXAChart = () => {
  const { start, balance, parameters } = useStakeEXA();

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
