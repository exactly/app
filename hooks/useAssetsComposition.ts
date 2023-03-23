import { BigNumber, formatFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';

import { useMemo } from 'react';
import { useTheme } from '@mui/material';
import formatNumber from 'utils/formatNumber';
import { toPercentage } from 'utils/utils';
import useAccountData from './useAccountData';
import useTotalsUsd from './useTotalsUsd';

type assetComposition = {
  name: string;
  usdValue: BigNumber | number | string;
  amount: BigNumber | number | string;
  percentage?: string;
  fill?: string;
};

export default function useAssetsComposition() {
  const { accountData } = useAccountData();
  const { totalDepositedUSD, totalBorrowedUSD } = useTotalsUsd();
  const { palette } = useTheme();

  const { loading, depositsComposition, borrowsComposition } = useMemo<{
    loading?: boolean;
    depositsComposition?: assetComposition[];
    borrowsComposition?: assetComposition[];
  }>(() => {
    if (!accountData) return {};

    const dComposition: assetComposition[] = [];
    const bComposition: assetComposition[] = [];

    accountData.forEach((market, i) => {
      const {
        floatingDepositAssets,
        floatingBorrowAssets,
        fixedDepositPositions,
        fixedBorrowPositions,
        decimals,
        usdPrice,
        assetSymbol,
      } = market;

      const depositedAssets = [];
      const borrowedAssets = [];

      depositedAssets.push(floatingDepositAssets);
      borrowedAssets.push(floatingBorrowAssets);

      fixedDepositPositions.forEach((depositPosition) => {
        depositedAssets.push(depositPosition.position.principal);
      });
      fixedBorrowPositions.forEach((borrowPosition) => {
        borrowedAssets.push(borrowPosition.position.principal);
      });

      const totalDepositedAssets = depositedAssets.reduce((accumulator, currentValue) => accumulator.add(currentValue));
      const totalBorrowedAssets = borrowedAssets.reduce((accumulator, currentValue) => accumulator.add(currentValue));

      const depositedAssetUSD = totalDepositedAssets.mul(usdPrice).div(10n ** BigInt(decimals));
      const borrowedAssetUSD = totalBorrowedAssets.mul(usdPrice).div(10n ** BigInt(decimals));

      if (!totalDepositedAssets.isZero()) {
        const depositData: assetComposition = {
          name: assetSymbol,
          usdValue: parseFloat(formatFixed(depositedAssetUSD, 18)),
          amount: formatNumber(formatFixed(totalDepositedAssets, decimals), assetSymbol, true),
          percentage: toPercentage(
            parseFloat(formatFixed(depositedAssetUSD.mul(WeiPerEther).div(totalDepositedUSD), 18)),
            2,
          ),
          fill: palette.colors[i] || palette.grey[500],
        };
        if (depositData.usdValue !== 0) dComposition.push(depositData);
      }

      if (!totalBorrowedAssets.isZero()) {
        const borrowData: assetComposition = {
          name: market.assetSymbol,
          usdValue: parseFloat(formatFixed(borrowedAssetUSD, 18)),
          amount: formatNumber(formatFixed(totalBorrowedAssets, decimals), assetSymbol),
          percentage: toPercentage(
            parseFloat(formatFixed(borrowedAssetUSD.mul(WeiPerEther).div(totalBorrowedUSD), 18)),
            2,
          ),
          fill: palette.colors[i] || palette.grey[500],
        };
        if (borrowData.usdValue !== 0) bComposition.push(borrowData);
      }
    });

    return { depositsComposition: dComposition, borrowsComposition: bComposition, loading: false };
  }, [accountData, palette.colors, palette.grey, totalBorrowedUSD, totalDepositedUSD]);

  return { loading, depositsComposition, borrowsComposition };
}
