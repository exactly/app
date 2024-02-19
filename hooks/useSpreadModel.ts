import { useMemo } from 'react';
import { parseEther } from 'viem';

import useAccountData from './useAccountData';
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
export const INTERVAL = parseEther('0.005');

const levels = 8;

export default function useSpreadModel(symbol: string) {
  const { marketAccount } = useAccountData(symbol);

  const irm = useIRM(symbol);

  const data = useMemo(() => {
    if (!marketAccount || !irm) {
      return [];
    }

    const {
      maxFuturePools,
      fixedPools,
      totalFloatingBorrowAssets,
      totalFloatingDepositAssets,
      floatingBackupBorrowed,
    } = marketAccount;

    const currentUFloating = floatingUtilization(totalFloatingDepositAssets, totalFloatingBorrowAssets);
    const currentUGlobal = globalUtilization(
      totalFloatingDepositAssets,
      totalFloatingBorrowAssets,
      floatingBackupBorrowed,
    );
    const pools = Object.fromEntries(fixedPools.map((pool) => [Number(pool.maturity), pool]));
    const maturities = fixedPools.map(({ maturity }) => maturity);
    const end = bmax(...maturities);

    const now = BigInt(Math.floor(Date.now() / 1000));

    const parameters = {
      timestamp: now,
      maxPools: BigInt(maxFuturePools),
      ...irm,
    };

    const model = spreadModel(parameters, currentUFloating, currentUGlobal);

    const steps = MAX / INTERVAL;
    const step = (BigInt(end) - now) / steps;

    const points: Record<string, number | number[]>[] = [];

    const ms = [...maturities, ...Array.from({ length: Number(steps) }).map((_, i) => now + BigInt(i) * step)];
    ms.sort((x, y) => Number(x - y));

    for (const m of ms) {
      const extend: Record<string, number | number[]> = {};
      if (pools[Number(m)]) {
        const pool = pools[Number(m)];
        const { rate, z } = fixedRate(
          { ...parameters, maturity: m },
          fixedUtilization(pool.supplied, pool.borrowed, totalFloatingDepositAssets),
          currentUFloating,
          currentUGlobal,
        );

        extend.z = Number(z) / 1e18;
        extend.rate = Number(rate) / 1e18;
        extend.highlight = 1;
      }

      points.push({
        date: Number(m),
        area: [Number(model(m, -WAD)) / 1e18, Number(model(m, WAD)) / 1e18],
        ...Object.fromEntries(
          [...Array(levels)].map((_, i, { length }) => {
            const z = WAD - (BigInt(i) * WAD) / BigInt(length);
            return [`area${i}`, [Number(model(m, -z)) / 1e18, Number(model(m, z)) / 1e18]];
          }),
        ),
        ...extend,
      });
    }

    return points;
  }, [irm, marketAccount]);

  return { data, levels, loading: data.length === 0 };
}
