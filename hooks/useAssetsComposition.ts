import { useMemo } from 'react';
import { formatUnits } from 'viem';
import { useTheme } from '@mui/material';
import formatNumber from 'utils/formatNumber';
import { toPercentage } from 'utils/utils';
import useAccountData from './useAccountData';
import useTotalsUsd from './useTotalsUsd';
import { WEI_PER_ETHER } from 'utils/const';

type AssetComposition = {
  name: string;
  usdValue: number;
  amount: string;
  percentage?: string;
  fill?: string;
};

export default function useAssetsComposition() {
  const { accountData } = useAccountData();
  const { totalDepositedUSD, totalBorrowedUSD } = useTotalsUsd();
  const { palette } = useTheme();

  const { depositsComposition, borrowsComposition } = useMemo<{
    depositsComposition?: AssetComposition[];
    borrowsComposition?: AssetComposition[];
  }>(() => {
    if (!accountData) return {};

    const dComposition: AssetComposition[] = [];
    const bComposition: AssetComposition[] = [];

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

      const depositedAssets = [
        floatingDepositAssets,
        ...fixedDepositPositions.map((depositPosition) => depositPosition.position.principal),
      ];
      const borrowedAssets = [
        floatingBorrowAssets,
        ...fixedBorrowPositions.map((borrowPosition) => borrowPosition.position.principal),
      ];

      const totalDepositedAssets = depositedAssets.reduce((accumulator, currentValue) => accumulator + currentValue);
      const totalBorrowedAssets = borrowedAssets.reduce((accumulator, currentValue) => accumulator + currentValue);

      const depositedAssetUSD = (totalDepositedAssets * usdPrice) / 10n ** BigInt(decimals);
      const borrowedAssetUSD = (totalBorrowedAssets * usdPrice) / 10n ** BigInt(decimals);

      if (totalDepositedAssets !== 0n) {
        const depositData: AssetComposition = {
          name: assetSymbol,
          usdValue: parseFloat(formatUnits(depositedAssetUSD, 18)),
          amount: formatNumber(formatUnits(totalDepositedAssets, decimals), assetSymbol, true),
          percentage: toPercentage(
            parseFloat(formatUnits((depositedAssetUSD * WEI_PER_ETHER) / totalDepositedUSD, 18)),
            2,
          ),
          fill: palette.colors[i] || palette.grey[500],
        };
        if (depositData.usdValue !== 0) dComposition.push(depositData);
      }

      if (totalBorrowedAssets !== 0n) {
        const borrowData: AssetComposition = {
          name: market.assetSymbol,
          usdValue: parseFloat(formatUnits(borrowedAssetUSD, 18)),
          amount: formatNumber(formatUnits(totalBorrowedAssets, decimals), assetSymbol),
          percentage: toPercentage(
            parseFloat(formatUnits((borrowedAssetUSD * WEI_PER_ETHER) / totalBorrowedUSD, 18)),
            2,
          ),
          fill: palette.colors[i] || palette.grey[500],
        };
        if (borrowData.usdValue !== 0) bComposition.push(borrowData);
      }
    });

    return { depositsComposition: dComposition, borrowsComposition: bComposition };
  }, [accountData, palette.colors, palette.grey, totalBorrowedUSD, totalDepositedUSD]);

  return { depositsComposition, borrowsComposition };
}
