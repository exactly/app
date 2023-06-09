import React, { useMemo } from 'react';
import { formatUnits } from 'viem';
import { useTranslation } from 'react-i18next';
import PaidIcon from '@mui/icons-material/Paid';
import OverviewCard from '../OverviewCard';
import formatNumber from 'utils/formatNumber';
import OverviewTopPositions, { TopAssetPosition } from '../OverviewTopPositions';
import useAccountData from 'hooks/useAccountData';
import { toPercentage } from 'utils/utils';
import { WEI_PER_ETHER } from 'utils/const';

const EarningsOverview = () => {
  const { t } = useTranslation();
  const { accountData } = useAccountData();

  const { assetPositions, totalUSD, totalFixedUSD, totalFloatingUSD, fixedPercentage, floatingPercentage } =
    useMemo(() => {
      if (!accountData) return {};

      const floatingAssetPositions = accountData.map(({ assetSymbol, floatingDepositAssets, usdPrice, decimals }) => {
        // const depositedUSD = floatingDepositAssets.mul(usdPrice).div(10n ** BigInt(decimals));
        // const previewUSD = floatingDepositAssets.mul(usdPrice).div(10n ** BigInt(decimals));

        return {
          symbol: assetSymbol,
          type: 'variable' as const,
          totalUSD: `$${formatNumber(
            formatUnits((floatingDepositAssets * usdPrice) / 10n ** BigInt(decimals), 18),
            'noDecimals',
          )}`,
          apr: `${(1.83).toFixed(2)}%`,
        };
      });

      const _assetPositions: TopAssetPosition[] = [...floatingAssetPositions];
      const _totalFixedUSD = 84454n * WEI_PER_ETHER;

      // const _totalFixedUSD = accountData.reduce((acc, { assetSymbol, fixedDepositAssets, usdPrice, decimals }) => {
      //   return acc.add(fixedDepositAssets.mul(usdPrice).div(10n ** BigInt(decimals)));
      // }, Zero);

      const _totalFloatingUSD = 66864n * WEI_PER_ETHER;
      const _totalUSD = _totalFixedUSD + _totalFloatingUSD;

      return {
        assetPositions: _assetPositions,
        totalUSD: _totalUSD,
        totalFixedUSD: _totalFixedUSD,
        totalFloatingUSD: _totalFloatingUSD,
        fixedPercentage: (_totalFixedUSD * WEI_PER_ETHER) / _totalUSD,
        floatingPercentage: (_totalFloatingUSD * WEI_PER_ETHER) / _totalUSD,
      };
    }, [accountData]);

  return (
    <OverviewCard
      title={`Mock ${t('Earnings')}`}
      icon={<PaidIcon sx={{ fontSize: 16 }} />}
      total={totalUSD ? `$${formatNumber(formatUnits(totalUSD, 18), 'USD', true)}` : undefined}
      fixedValue={totalFixedUSD ? `$${formatNumber(formatUnits(totalFixedUSD, 18), 'USD', true)}` : undefined}
      floatingValue={totalFloatingUSD ? `$${formatNumber(formatUnits(totalFloatingUSD, 18), 'USD', true)}` : undefined}
      subFixedValue={fixedPercentage ? toPercentage(Number(fixedPercentage) / 1e18) : undefined}
      subFloatingValue={floatingPercentage ? toPercentage(Number(floatingPercentage) / 1e18) : undefined}
      mobileWrap
    >
      <OverviewTopPositions assets={assetPositions} />
    </OverviewCard>
  );
};

export default EarningsOverview;
