import { useMemo } from 'react';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';
import baseRate from '@exactly/lib/esm/interest-rate-model/baseRate';
import fixedRate from '@exactly/lib/esm/interest-rate-model/fixedRate';
import fixedUtilization from '@exactly/lib/esm/interest-rate-model/fixedUtilization';
import floatingRate from '@exactly/lib/esm/interest-rate-model/floatingRate';
import floatingUtilization from '@exactly/lib/esm/interest-rate-model/floatingUtilization';
import globalUtilization from '@exactly/lib/esm/interest-rate-model/globalUtilization';

import useAccountData from './useAccountData';
import useIRM from './useIRM';

export const MAX = 1;
export const INTERVAL = 0.005;

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

    const uFloating = floatingUtilization(totalFloatingDepositAssets, totalFloatingBorrowAssets);
    const uGlobal = globalUtilization(totalFloatingDepositAssets, totalFloatingBorrowAssets, floatingBackupBorrowed);
    const pools = Object.fromEntries(fixedPools.map((pool) => [String(pool.maturity), pool]));
    const maturities = fixedPools.map(({ maturity }) => Number(maturity));
    const end = Math.max(...maturities);
    const now = Math.floor(Date.now() / 1000);
    const steps = MAX / INTERVAL;

    const points: Record<string, number | number[]>[] = [];

    const base = baseRate(uFloating, uGlobal, irm);

    for (const date of [
      ...maturities,
      ...Array.from({ length: Number(steps) }).map((_, i) => Math.floor(now + i * ((end - now) / steps))),
    ].sort()) {
      const extend: Record<string, number | number[]> = {};
      if (pools[date]) {
        extend.rate =
          Number(
            fixedRate(
              date,
              maxFuturePools,
              fixedUtilization(pools[date].supplied, pools[date].borrowed, totalFloatingDepositAssets),
              uFloating,
              uGlobal,
              irm,
              now,
              base,
            ),
          ) / 1e18;
        extend.highlight = 1;
      } else if (date === now) {
        extend.rate = Number(floatingRate(uFloating, uGlobal, irm)) / 1e18;
        extend.highlight = 1;
      }

      points.push({
        date: date,
        ...Object.fromEntries(
          [...Array(levels)].map((_, i, { length }) => {
            const z = WAD - (BigInt(i) * WAD) / BigInt(length);
            return [
              `area${i}`,
              date <= now
                ? [Number(base) / 1e18, Number(base) / 1e18]
                : [
                    Number(fixedRate(date, maxFuturePools, 0n, uFloating, uGlobal, irm, now, base, -z)) / 1e18,
                    Number(fixedRate(date, maxFuturePools, 0n, uFloating, uGlobal, irm, now, base, z)) / 1e18,
                  ],
            ];
          }),
        ),
        ...extend,
      });
    }

    return points;
  }, [irm, marketAccount]);

  return { data, levels, loading: data.length === 0 };
}
