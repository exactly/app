import { useMemo } from 'react';
import { parseEther } from 'viem';

import useAccountData from './useAccountData';
import { floatingUtilization, floatingInterestRateCurve } from 'utils/interestRateCurve';
import useIRM from './useIRM';

export const MAX = 10n ** 18n;
export const INTERVAL = parseEther('0.005');

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
  const irm = useIRM(symbol);

  const data = useMemo(() => {
    if (!irm) {
      return;
    }

    const curve = floatingInterestRateCurve(irm);

    const utilizations: bigint[] = [];
    const globalUtilizations: bigint[] = [];

    const z: (bigint | typeof NaN)[][] = [];

    for (let i = from; i < to; i = i + interval) {
      utilizations.push(i);
      globalUtilizations.push(i);
    }

    for (const globalUtilization of globalUtilizations) {
      const row: (bigint | typeof NaN)[] = [];
      for (const utilization of utilizations) {
        if (utilization > globalUtilization) {
          row.push(NaN);
          continue;
        }
        row.push(curve(utilization, globalUtilization));
      }
      z.push(row);
    }

    return [
      utilizations.map((v) => Number(v) / 1e18),
      globalUtilizations.map((v) => Number(v) / 1e18),
      z.map((vs) => vs.map((v) => (typeof v === 'bigint' ? Number(v) / 1e18 : v))),
    ] as const;
  }, [irm, from, to, interval]);

  return {
    data,
    loading: !irm,
    irm,
  };
}
