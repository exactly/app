import { useMemo } from 'react';
import { parseEther } from 'viem';

import { useMarketFloatingAssets, useMarketFloatingBackupBorrowed, useMarketFloatingDebt } from 'types/abi';
import useAccountData from './useAccountData';
import { useWeb3 } from './useWeb3';
import {
  fixedRate,
  fixedUtilization,
  floatingUtilization,
  globalUtilization,
  spreadModel,
} from 'utils/interestRateCurve';
import { WAD, bmax } from 'utils/fixedMath';
import useIRM from './useIRM';

export const MAX = 10n ** 18n;
export const INTERVAL = parseEther('0.0005');

export default function useSpreadModel(symbol: string) {
  const { chain } = useWeb3();
  const { marketAccount } = useAccountData(symbol);

  const { data: floatingDebt } = useMarketFloatingDebt({ address: marketAccount?.market, chainId: chain.id });
  const { data: floatingAssets } = useMarketFloatingAssets({ address: marketAccount?.market, chainId: chain.id });
  const { data: floatingBackupBorrowed } = useMarketFloatingBackupBorrowed({
    address: marketAccount?.market,
    chainId: chain.id,
  });

  const irmParams = useIRM(symbol);

  const data = useMemo(() => {
    if (
      !marketAccount ||
      floatingDebt === undefined ||
      floatingAssets === undefined ||
      floatingBackupBorrowed === undefined ||
      irmParams === undefined
    ) {
      return [];
    }

    const { interestRateModel, maxFuturePools, fixedPools } = marketAccount;

    const { A, B, uMax } = {
      A: interestRateModel.floatingCurveA,
      B: interestRateModel.floatingCurveB,
      uMax: interestRateModel.floatingMaxUtilization,
    };

    const currentUFloating = floatingUtilization(floatingAssets, floatingDebt);
    const currentUGlobal = globalUtilization(floatingAssets, floatingDebt, floatingBackupBorrowed);
    const pools: Record<number, (typeof fixedPools)[number]> = Object.fromEntries(
      fixedPools.map((pool) => [Number(pool.maturity), pool]),
    );
    const maturities = fixedPools.map(({ maturity }) => maturity);
    const end = bmax(...maturities);

    const now = BigInt(Math.floor(Date.now() / 1000));

    const parameters = {
      timestamp: now,
      maxPools: BigInt(maxFuturePools),
      a: A,
      b: B,
      maxUtilization: uMax,
      ...irmParams,
    };

    const model = spreadModel(parameters, currentUFloating, currentUGlobal);

    const steps = MAX / INTERVAL;
    const step = (BigInt(end) - now) / steps;

    const points: Record<string, number | number[]>[] = [];

    const ms = [...maturities, ...Array.from({ length: Number(steps) }).map((_, i) => now + BigInt(i) * step)];
    ms.sort((x, y) => Number(x - y));

    for (const m of ms) {
      const lo = model(m, -WAD);
      const mid = model(m, 0n);
      const hi = model(m, WAD);

      const extend: Record<string, number | number[]> = {};
      if (pools[Number(m)]) {
        const pool = pools[Number(m)];
        const fr = fixedRate(
          { ...parameters, maturity: m },
          fixedUtilization(pool.supplied, pool.borrowed, floatingAssets),
          currentUFloating,
          currentUGlobal,
        );

        extend['rate'] = Number(fr) / 1e18;
        extend['highlight'] = 1;
      }

      points.push({
        date: Number(m),
        maturity: Number(((m - now) / step) * INTERVAL) / 1e18,
        area: [Number(lo) / 1e18, Number(hi) / 1e18],
        mid: Number(mid) / 1e18,
        ...extend,
      });
    }

    return points;
  }, [floatingAssets, floatingBackupBorrowed, floatingDebt, irmParams, marketAccount]);

  return { data, loading: data.length === 0 };
}
