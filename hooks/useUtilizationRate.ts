import { useMemo } from 'react';
import { parseEther } from 'viem';

import useAccountData from './useAccountData';
import { floatingInterestRateCurve } from 'utils/interestRateCurve';
import { WAD } from 'utils/fixedMath';
import { useMarketFloatingAssets, useMarketFloatingBackupBorrowed, useMarketFloatingDebt } from 'types/abi';

export const MAX = 10n ** 18n;
export const INTERVAL = parseEther('0.0005');
export const STEP = 10;
const uGlobals = Array.from({ length: Math.ceil(100 / STEP) }).map((_, i) => parseEther(String(i * STEP)) / 100n);

export function useCurrentUtilizationRate(type: 'floating' | 'fixed', symbol: string) {
  const { marketAccount } = useAccountData(symbol);

  return useMemo(() => {
    if (!marketAccount) return undefined;

    const { floatingUtilization, fixedPools } = marketAccount;
    if (!floatingUtilization || fixedPools === undefined) {
      return undefined;
    }

    const allUtilizations: { utilization: bigint; maturity?: number }[] = [];

    if (type === 'fixed') {
      fixedPools.forEach((pool) => {
        allUtilizations.push({ maturity: Number(pool.maturity), utilization: pool.utilization });
      });
    }

    if (type === 'floating') {
      allUtilizations.push({ utilization: floatingUtilization });
    }
    return allUtilizations;
  }, [marketAccount, type]);
}

export default function useUtilizationRate(symbol: string, from = 0n, to = MAX, interval = INTERVAL) {
  const { marketAccount } = useAccountData(symbol);

  const { data: floatingDebt } = useMarketFloatingDebt({ address: marketAccount?.market });
  const { data: floatingAssets } = useMarketFloatingAssets({ address: marketAccount?.market });
  const { data: floatingBackupBorrowed } = useMarketFloatingBackupBorrowed({ address: marketAccount?.market });

  const data = useMemo(() => {
    if (
      !marketAccount ||
      floatingDebt === undefined ||
      floatingAssets === undefined ||
      floatingBackupBorrowed === undefined
    ) {
      return [];
    }

    const { interestRateModel } = marketAccount;

    const { A, B, uMax } = {
      A: interestRateModel.floatingCurveA,
      B: interestRateModel.floatingCurveB,
      uMax: interestRateModel.floatingMaxUtilization,
    };

    const points: Record<string, number>[] = [];

    const curve = floatingInterestRateCurve({
      a: A,
      b: B,
      maxUtilization: uMax,
      // TODO
      floatingNaturalUtilization: 700000000000000000n,
      sigmoidSpeed: 2500000000000000000n,
      growthSpeed: 1000000000000000000n,
      maxRate: 150000000000000000000n,
    });

    const currentUFloating = floatingAssets > 0n ? (floatingDebt * WAD) / floatingAssets : 0n;
    const currentUGlobal =
      floatingAssets > 0n
        ? WAD - ((floatingAssets - floatingDebt - floatingBackupBorrowed) * WAD) / floatingAssets
        : 0n;

    const globalUtilizations = [...uGlobals, currentUGlobal].sort();

    for (let u = from; u < to; u = u + interval) {
      const curves: Record<string, number> = {};

      for (const uGlobal of globalUtilizations) {
        if (u > uGlobal) continue;
        const r = curve(u, uGlobal);
        curves[uGlobal === currentUGlobal ? 'current' : `curve${uGlobals.indexOf(uGlobal)}`] = Number(r) / 1e18;
      }

      points.push({ utilization: Number(u) / 1e18, ...curves });
    }

    const curves: Record<string, number> = {};
    for (const uGlobal of globalUtilizations) {
      if (currentUFloating > uGlobal) continue;
      const r = curve(currentUFloating, uGlobal);
      curves[uGlobal === currentUGlobal ? 'current' : `curve${uGlobals.indexOf(uGlobal)}`] = Number(r) / 1e18;
      if (uGlobal === currentUGlobal) {
        curves['highlight'] = 1;
      }
    }

    points.push({
      utilization: Number(currentUFloating) / 1e18,
      ...curves,
    });

    points.sort((x, y) => x.utilization - y.utilization);

    return points;
  }, [marketAccount, floatingDebt, floatingAssets, floatingBackupBorrowed, from, to, interval]);

  return {
    data,
    loading:
      !marketAccount ||
      floatingDebt === undefined ||
      floatingAssets === undefined ||
      floatingBackupBorrowed === undefined,
  };
}
