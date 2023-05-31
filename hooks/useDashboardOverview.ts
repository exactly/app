import { BigNumber } from '@ethersproject/bignumber';
import { useMemo } from 'react';
import useAccountData from './useAccountData';
import useTotalsUsd from './useTotalsUsd';
import { AssetPosition } from 'components/newDashboard/DashboardSummary/DashboardOverview/DualProgressBarPosition';
import { WeiPerEther, Zero } from '@ethersproject/constants';

export default function useDashboardOverview(type: 'deposit' | 'borrow') {
  const { accountData } = useAccountData();
  const { totalDepositedUSD, totalBorrowedUSD } = useTotalsUsd();

  const totalUSD = useMemo(
    () => (type === 'deposit' ? totalDepositedUSD : totalBorrowedUSD),
    [totalDepositedUSD, totalBorrowedUSD, type],
  );

  const { assetPositions, totalFixedUSD, totalFloatingUSD, fixedPercentage, floatingPercentage } = useMemo(() => {
    if (!accountData || totalUSD.isZero()) return {};

    const _assetPositions: AssetPosition[] = accountData.map(
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
          (acc: BigNumber, { position: { principal } }) => acc.add(principal),
          Zero,
        );

        const fixedValueUSD = totalFixedAssets.mul(usdPrice).div(10n ** BigInt(decimals));
        const floatingValueUSD = floatingAssets.mul(usdPrice).div(10n ** BigInt(decimals));

        return {
          symbol: assetSymbol,
          decimals: decimals,
          fixedAssets: totalFixedAssets,
          fixedValueUSD,
          floatingAssets: floatingAssets,
          floatingValueUSD,
          percentageOfTotal: fixedValueUSD.add(floatingValueUSD).mul(WeiPerEther).div(totalUSD),
        };
      },
    );

    const _totalFixedUSD = _assetPositions.reduce((acc, { fixedValueUSD }) => acc.add(fixedValueUSD), Zero);
    const _totalFloatingUSD = _assetPositions.reduce((acc, { floatingValueUSD }) => acc.add(floatingValueUSD), Zero);

    return {
      assetPositions: _assetPositions,
      totalFixedUSD: _totalFixedUSD,
      totalFloatingUSD: _totalFloatingUSD,
      fixedPercentage: _totalFixedUSD.mul(WeiPerEther).div(totalUSD),
      floatingPercentage: _totalFloatingUSD.mul(WeiPerEther).div(totalUSD),
    };
  }, [accountData, totalUSD, type]);

  return { totalUSD, assetPositions, totalFixedUSD, totalFloatingUSD, fixedPercentage, floatingPercentage };
}
