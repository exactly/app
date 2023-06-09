import { useMemo } from 'react';

import useAccountData from './useAccountData';
import interestRateCurve, { inverseInterestRateCurve } from 'utils/interestRateCurve';
import numbers from 'config/numbers.json';

const MAX = 1;
const INTERVAL = numbers.chartInterval;

export default function useUtilizationRate(
  type: 'floating' | 'fixed',
  symbol: string,
  from = 0,
  to = MAX,
  interval = INTERVAL,
  mandatoryPoints: number[] = [],
  inversePoints: bigint[] = [],
) {
  const { marketAccount } = useAccountData(symbol);

  const data = useMemo(() => {
    if (!marketAccount) {
      return [];
    }

    const { interestRateModel } = marketAccount;

    const { A, B, UMax } =
      type === 'floating'
        ? {
            A: interestRateModel.floatingCurveA,
            B: interestRateModel.floatingCurveB,
            UMax: interestRateModel.floatingMaxUtilization,
          }
        : {
            A: interestRateModel.fixedCurveA,
            B: interestRateModel.fixedCurveB,
            UMax: interestRateModel.fixedMaxUtilization,
          };

    const curve = interestRateCurve(Number(A) / 1e18, Number(B) / 1e18, Number(UMax) / 1e18);
    const points = Array.from({ length: Math.ceil(Math.abs(to - from) / interval) + 1 }).map((_, i) => {
      const utilization = from + i * interval;
      return { utilization, apr: curve(utilization) };
    });

    if (mandatoryPoints.length) {
      points.push(...mandatoryPoints.map((utilization) => ({ utilization, apr: curve(utilization) })));
    }

    if (inversePoints.length) {
      const inverseCurve = inverseInterestRateCurve(A, B, UMax);
      points.push(
        ...inversePoints.map((apr) => ({ utilization: Number(inverseCurve(apr)) / 1e18, apr: Number(apr) / 1e18 })),
      );
    }

    if (mandatoryPoints.length || inversePoints.length) {
      points.sort((a, b) => a.utilization - b.utilization);
    }

    return points;
  }, [marketAccount, type, from, to, interval, mandatoryPoints, inversePoints]);

  const currentUtilization = useMemo(() => {
    if (!marketAccount) return undefined;

    const { floatingUtilization, fixedPools } = marketAccount;
    if (!floatingUtilization || fixedPools === undefined) {
      return undefined;
    }

    const allUtilizations: Record<string, number>[] = [];

    if (type === 'fixed') {
      fixedPools.forEach((pool) => {
        allUtilizations.push({ maturity: Number(pool.maturity), utilization: Number(pool.utilization) / 1e18 });
      });
    }

    if (type === 'floating') {
      allUtilizations.push({ utilization: Number(floatingUtilization) / 1e18 });
    }
    return allUtilizations;
  }, [marketAccount, type]);

  return { currentUtilization, data, loading: !currentUtilization || !marketAccount };
}
