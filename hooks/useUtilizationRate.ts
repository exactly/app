import { useMemo } from 'react';

import useAccountData from './useAccountData';
import interestRateCurve from 'utils/interestRateCurve';
import numbers from 'config/numbers.json';

const MAX = 1;
const INTERVAL = numbers.chartInterval;

export default function useUtilizationRate(type: 'floating' | 'fixed', symbol: string, mandatoryPoints?: number[]) {
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

    const points = Array.from({ length: MAX / INTERVAL }).map((_, i) => {
      const utilization = i * INTERVAL;
      return { utilization, apr: curve(utilization) };
    });

    if (mandatoryPoints) {
      points.push(...mandatoryPoints.map((utilization) => ({ utilization, apr: curve(utilization) })));
      points.sort((a, b) => a.utilization - b.utilization);
    }
    return points;
  }, [marketAccount, type, mandatoryPoints]);

  const currentUtilization = useMemo(() => {
    if (!marketAccount) return undefined;

    const { floatingUtilization, fixedPools } = marketAccount;
    if (!floatingUtilization || fixedPools === undefined) {
      return undefined;
    }

    const allUtilizations: Record<string, number>[] = [];

    if (type === 'fixed') {
      fixedPools.forEach((pool) => {
        allUtilizations.push({ maturity: pool.maturity.toNumber(), utilization: Number(pool.utilization) / 1e18 });
      });
    }

    if (type === 'floating') {
      allUtilizations.push({ utilization: Number(floatingUtilization) / 1e18 });
    }
    return allUtilizations;
  }, [marketAccount, type]);

  return { currentUtilization, data, loading: !currentUtilization || !marketAccount };
}
