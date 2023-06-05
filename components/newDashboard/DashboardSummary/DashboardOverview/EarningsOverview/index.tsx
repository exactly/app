import React, { useMemo } from 'react';
import PaidIcon from '@mui/icons-material/Paid';
import OverviewCard from '../OverviewCard';
import formatNumber from 'utils/formatNumber';
import OverviewTopPositions, { TopAssetPosition } from '../OverviewTopPositions';
import { useTranslation } from 'react-i18next';
import useAccountData from 'hooks/useAccountData';
import { BigNumber, formatFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';
import { toPercentage } from 'utils/utils';

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
            formatFixed(floatingDepositAssets.mul(usdPrice).div(10n ** BigInt(decimals)), 18),
            'noDecimals',
          )}`,
          apr: `${(1.83).toFixed(2)}%`,
        };
      });

      const _assetPositions: TopAssetPosition[] = [...floatingAssetPositions];
      const _totalFixedUSD = BigNumber.from(84454).mul(WeiPerEther);

      // const _totalFixedUSD = accountData.reduce((acc, { assetSymbol, fixedDepositAssets, usdPrice, decimals }) => {
      //   return acc.add(fixedDepositAssets.mul(usdPrice).div(10n ** BigInt(decimals)));
      // }, Zero);

      const _totalFloatingUSD = BigNumber.from(66864).mul(WeiPerEther);
      const _totalUSD = _totalFixedUSD.add(_totalFloatingUSD);

      return {
        assetPositions: _assetPositions,
        totalUSD: _totalUSD,
        totalFixedUSD: _totalFixedUSD,
        totalFloatingUSD: _totalFloatingUSD,
        fixedPercentage: _totalFixedUSD.mul(WeiPerEther).div(_totalUSD),
        floatingPercentage: _totalFloatingUSD.mul(WeiPerEther).div(_totalUSD),
      };
    }, [accountData]);

  return (
    <OverviewCard
      title={`Mock ${t('Earnings')}`}
      icon={<PaidIcon sx={{ fontSize: 16 }} />}
      total={totalUSD ? `$${formatNumber(formatFixed(totalUSD, 18), 'USD', true)}` : undefined}
      fixedValue={totalFixedUSD ? `$${formatNumber(formatFixed(totalFixedUSD, 18), 'USD', true)}` : undefined}
      floatingValue={totalFloatingUSD ? `$${formatNumber(formatFixed(totalFloatingUSD, 18), 'USD', true)}` : undefined}
      subFixedValue={fixedPercentage ? toPercentage(Number(fixedPercentage) / 1e18) : undefined}
      subFloatingValue={floatingPercentage ? toPercentage(Number(floatingPercentage) / 1e18) : undefined}
      mobileWrap
    >
      <OverviewTopPositions assets={assetPositions} />
    </OverviewCard>
  );
};

export default EarningsOverview;
