import { useMemo } from 'react';

import useAccountData from './useAccountData';
import interestRateCurve from 'utils/interestRateCurve';
import numbers from 'config/numbers.json';

const MAX = 1;
const INTERVAL = numbers.chartInterval;

export default function useUtilizationRate(type: 'floating' | 'fixed', symbol: string) {
  const { floatingUtilization, interestRateModel, fixedPools } = useAccountData(symbol);

  const data = useMemo(() => {
    if (!interestRateModel) {
      return [];
    }

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

    return Array.from({ length: MAX / INTERVAL }).map((_, i) => {
      const utilization = i * INTERVAL;
      return { utilization, apr: curve(utilization) };
    });
  }, [type, interestRateModel]);

  const currentUtilization = useMemo(() => {
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
  }, [fixedPools, floatingUtilization, type]);

  return { currentUtilization, data, loading: !currentUtilization || !interestRateModel };
}
