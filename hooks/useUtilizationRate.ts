import { useMemo } from 'react';
import { parseEther } from 'viem';

import useAccountData from './useAccountData';
import { floatingInterestRateCurve, floatingUtilization, globalUtilization } from 'utils/interestRateCurve';
import { useMarketFloatingAssets, useMarketFloatingBackupBorrowed, useMarketFloatingDebt } from 'types/abi';
import { useWeb3 } from './useWeb3';

export const MAX = 10n ** 18n;
export const INTERVAL = parseEther('0.0005');
export const STEP = 10;
const uGlobals = Array.from({ length: 100 % STEP === 0 ? 100 / STEP + 1 : Math.ceil(100 / STEP) }).map(
  (_, i) => parseEther(String(i * STEP)) / 100n,
);

export function useCurrentUtilizationRate(type: 'floating' | 'fixed', symbol: string) {
  const { marketAccount } = useAccountData(symbol);

  return useMemo(() => {
    if (!marketAccount) return undefined;

    const { floatingUtilization: utilization, fixedPools } = marketAccount;
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
      allUtilizations.push({ utilization });
    }
    return allUtilizations;
  }, [marketAccount, type]);
}

export default function useUtilizationRate(symbol: string, from = 0n, to = MAX, interval = INTERVAL) {
  const { chain } = useWeb3();
  const { marketAccount } = useAccountData(symbol);

  const { data: floatingDebt } = useMarketFloatingDebt({ address: marketAccount?.market, chainId: chain.id });
  const { data: floatingAssets } = useMarketFloatingAssets({ address: marketAccount?.market, chainId: chain.id });
  const { data: floatingBackupBorrowed } = useMarketFloatingBackupBorrowed({
    address: marketAccount?.market,
    chainId: chain.id,
  });

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
      naturalUtilization: 700000000000000000n,
      sigmoidSpeed: 2500000000000000000n,
      growthSpeed: 1000000000000000000n,
      maxRate: 150000000000000000000n,
    });

    const currentUFloating = floatingUtilization(floatingAssets, floatingDebt);
    const currentUGlobal = globalUtilization(floatingAssets, floatingDebt, floatingBackupBorrowed);

    const globalUtilizations = [...uGlobals, currentUGlobal].sort();

    for (let u = from; u < to; u = u + interval) {
      const curves: Record<string, number> = {};

      for (const uG of globalUtilizations) {
        if (u > uG) continue;
        const r = curve(u, uG);
        curves[uG === currentUGlobal ? 'current' : `curve${uGlobals.indexOf(uG)}`] = Number(r) / 1e18;
      }

      points.push({ utilization: Number(u) / 1e18, ...curves });
    }

    const curves: Record<string, number> = {};
    for (const uG of globalUtilizations) {
      if (currentUFloating > uG) continue;
      const r = curve(currentUFloating, uG);
      curves[uG === currentUGlobal ? 'current' : `curve${uGlobals.indexOf(uG)}`] = Number(r) / 1e18;
      if (uG === currentUGlobal) {
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
