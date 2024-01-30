import { useMemo } from 'react';
import { parseEther } from 'viem';

import useAccountData from './useAccountData';
import { floatingInterestRateCurve, floatingUtilization, globalUtilization } from 'utils/interestRateCurve';
import useIRM from './useIRM';

export const MAX = 10n ** 18n;
export const INTERVAL = parseEther('0.0005');
export const STEP = 10;

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

  const [data, gu] = useMemo(() => {
    if (!marketAccount || !irm) {
      return [undefined, 0n] as const;
    }

    const { floatingAssets, floatingDebt, floatingBackupBorrowed } = marketAccount;

    const points: Record<string, number>[] = [];

    const curve = floatingInterestRateCurve(irm);

    const currentUFloating = floatingUtilization(floatingAssets, floatingDebt);
    const currentUGlobal = globalUtilization(floatingAssets, floatingDebt, floatingBackupBorrowed);

    for (let u = from; u < to; u = u + interval) {
      if (u > currentUGlobal) {
        break;
      }
      const r = curve(u, currentUGlobal);
      points.push({ utilization: Number(u) / 1e18, apr: Number(r) / 1e18 });
    }

    const r = curve(currentUFloating, currentUGlobal);
    points.push({
      utilization: Number(currentUFloating) / 1e18,
      apr: Number(r) / 1e18,
      highlight: 1,
    });

    points.sort((x, y) => x.utilization - y.utilization);

    return [points, currentUGlobal] as const;
  }, [marketAccount, irm, from, to, interval]);

  return {
    data,
    globalUtilization: gu,
    loading: !marketAccount,
  };
}
