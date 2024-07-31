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
  const {
    start,
    parameters: {
      refTime: _refTime,
      penaltyGrowth: _penaltyGrowth,
      minTime: _minTime,
      excessFactor: _excessFactor,
      penaltyThreshold: _penaltyThreshold,
    },
  } = useStakeEXA();

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
    if (
      _minTime !== undefined &&
      _refTime !== undefined &&
      start !== undefined &&
      _excessFactor !== undefined &&
      _penaltyGrowth !== undefined &&
      _penaltyThreshold !== undefined
    ) {
      const now = parseEther(Math.floor(Date.now() / 1000).toString());
      const minTime = _minTime * WAD;
      const avgStart = start > 0n ? start : now;
      const cliff = avgStart + minTime;
      const refTime = _refTime * WAD;
      const optimalStakeTime = avgStart + refTime;
      const extra = now > optimalStakeTime ? now - optimalStakeTime + 172_800n * WAD : 172_800n * WAD;
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

        const value = calculateValue(time, minTime, refTime, _penaltyGrowth, _excessFactor, _penaltyThreshold);

        dataPoints.push({
          date: Number(formatEther(timestamp)),
          value: Number(formatEther(value)),
        });
      }

      for (let i = 0; i < mainPoints.length; i++) {
        const timestamp = mainPoints[i];
        const time = timestamp - avgStart;

        const value = calculateValue(time, minTime, refTime, _penaltyGrowth, _excessFactor, _penaltyThreshold);

        dataPoints.push({
          date: Number(formatEther(timestamp)),
          value: Number(value) / 1e18,
        });
      }

      return dataPoints.sort((a, b) => a.date - b.date);
    }
    return [];
  }, [_minTime, _refTime, start, _excessFactor, _penaltyGrowth, _penaltyThreshold, calculateValue]);

  return points;
};
