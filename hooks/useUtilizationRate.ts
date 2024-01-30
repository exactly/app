import { useMemo } from 'react';
import { parseEther } from 'viem';

import useAccountData from './useAccountData';
import { floatingInterestRateCurve, floatingUtilization, globalUtilization } from 'utils/interestRateCurve';
import useIRM from './useIRM';

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
  const { marketAccount } = useAccountData(symbol);

  const irm = useIRM(symbol);

  const data = useMemo(() => {
    if (!marketAccount || !irm) {
      return [];
    }

    const { floatingAssets, floatingDebt, floatingBackupBorrowed } = marketAccount;

    const points: Record<string, number>[] = [];

    const curve = floatingInterestRateCurve(irm);

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
  }, [marketAccount, irm, from, to, interval]);

  return {
    data,
    loading: !marketAccount,
  };
}
