import { useMemo } from 'react';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

import useAccountData from './useAccountData';
import useTotalsUsd from './useTotalsUsd';
import { AssetPosition } from 'components/newDashboard/DashboardSummary/DashboardOverview/DualProgressBarPosition';

export default function useDashboardOverview(type: 'deposit' | 'borrow') {
  const { accountData } = useAccountData();
  const { totalDepositedUSD, totalBorrowedUSD } = useTotalsUsd();

  const totalUSD = useMemo(
    () => (type === 'deposit' ? totalDepositedUSD : totalBorrowedUSD),
    [totalDepositedUSD, totalBorrowedUSD, type],
  );

  const { assetPositions, totalFixedUSD, totalFloatingUSD, fixedPercentage, floatingPercentage } = useMemo(() => {
    if (!accountData || totalUSD === 0n) return {};

    const _assetPositions: AssetPosition[] = accountData
      .map(
        ({
          assetSymbol,
          floatingDepositAssets,
          fixedDepositPositions,
          floatingBorrowAssets,
          fixedBorrowPositions,
          usdPrice,
          decimals,
        }) => {
          const fixedPositions = type === 'deposit' ? fixedDepositPositions : fixedBorrowPositions;
          const floatingAssets = type === 'deposit' ? floatingDepositAssets : floatingBorrowAssets;

          const totalFixedAssets = fixedPositions.reduce(
            (acc: bigint, { position: { principal } }) => acc + principal,
            0n,
          );

          const fixedValueUSD = (totalFixedAssets * usdPrice) / 10n ** BigInt(decimals);
          const floatingValueUSD = (floatingAssets * usdPrice) / 10n ** BigInt(decimals);

          return {
            symbol: assetSymbol,
            decimals: decimals,
            fixedAssets: totalFixedAssets,
            fixedValueUSD,
            floatingAssets: floatingAssets,
            floatingValueUSD,
            percentageOfTotal: ((fixedValueUSD + floatingValueUSD) * WAD) / totalUSD,
          };
        },
      )
      .filter(({ fixedValueUSD, floatingValueUSD }) => fixedValueUSD + floatingValueUSD > 0n);

    const _totalFixedUSD = _assetPositions.reduce((acc, { fixedValueUSD }) => acc + fixedValueUSD, 0n);
    const _totalFloatingUSD = _assetPositions.reduce((acc, { floatingValueUSD }) => acc + floatingValueUSD, 0n);

    return {
      assetPositions: _assetPositions,
      totalFixedUSD: _totalFixedUSD,
      totalFloatingUSD: _totalFloatingUSD,
      fixedPercentage: (_totalFixedUSD * WAD) / totalUSD,
      floatingPercentage: (_totalFloatingUSD * WAD) / totalUSD,
    };
  }, [accountData, totalUSD, type]);

  return { totalUSD, assetPositions, totalFixedUSD, totalFloatingUSD, fixedPercentage, floatingPercentage };
}
