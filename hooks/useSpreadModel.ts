import { useMemo } from 'react';
import {
  WAD,
  baseRate,
  fixedRate,
  fixedUtilization,
  floatingRate,
  floatingUtilization,
  globalUtilization,
} from '@exactly/lib';

import usePreviewerExactly from './usePreviewerExactly';
import useIRM from './useIRM';
import { useReadMarketPreviewFloatingAssetsAverage } from 'generated/wagmi';
import { defaultChain } from 'utils/client';

export const MAX = 1;
export const INTERVAL = 0.005;

const levels = 8;

export default function useSpreadModel(symbol: string) {
  const { data: accountData } = usePreviewerExactly();
  const marketAccount = accountData?.find((market) => market.assetSymbol === symbol);
  const irm = useIRM(symbol);
  const { data: floatingAssetsAverage } = useReadMarketPreviewFloatingAssetsAverage({
    address: marketAccount?.market,
    chainId: defaultChain.id,
    query: { enabled: Boolean(marketAccount?.market) },
  });

  const data = useMemo(() => {
    if (!marketAccount || !irm || !floatingAssetsAverage) {
      return [];
    }

    const { maxFuturePools, fixedPools, totalFloatingBorrowAssets, floatingBackupBorrowed } = marketAccount;

    const uFloating = floatingUtilization(floatingAssetsAverage, totalFloatingBorrowAssets);
    const uGlobal = globalUtilization(floatingAssetsAverage, totalFloatingBorrowAssets, floatingBackupBorrowed);
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
              fixedUtilization(pools[date].supplied, pools[date].borrowed, floatingAssetsAverage),
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
  }, [irm, marketAccount, floatingAssetsAverage]);

  return { data, levels, loading: data.length === 0 };
}
