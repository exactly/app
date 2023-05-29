import React from 'react';
import PaidIcon from '@mui/icons-material/Paid';
import OverviewCard from '../OverviewCard';
import formatNumber from 'utils/formatNumber';
import OverviewTopPositions, { TopAssetPosition } from '../OverviewTopPositions';
import { useTranslation } from 'react-i18next';

const EarningsOverview = () => {
  const { t } = useTranslation();

  const assets: TopAssetPosition[] = [
    {
      symbol: 'WETH',
      type: 'fixed',
      totalUSD: `$${formatNumber(96000, 'noDecimals')}`,
      apr: `${(1.66).toFixed(2)}%`,
    },
    {
      symbol: 'WBTC',
      type: 'variable',
      totalUSD: `$${formatNumber(113000, 'noDecimals')}`,
      apr: `${(1.37).toFixed(2)}%`,
    },
    {
      symbol: 'USDC',
      type: 'variable',
      totalUSD: `$${formatNumber(68000, 'noDecimals')}`,
      apr: `${(0.93).toFixed(2)}%`,
    },
    {
      symbol: 'DAI',
      type: 'variable',
      totalUSD: `$${formatNumber(51000, 'noDecimals')}`,
      apr: `${(1.26).toFixed(2)}%`,
    },
  ];

  return (
    <OverviewCard
      title={t('Earnings')}
      icon={<PaidIcon sx={{ fontSize: 16 }} />}
      total={`$${formatNumber(151318.03, 'USD', true)}`}
      fixedValue={`$${formatNumber(84453.74, 'USD', true)}`}
      floatingValue={`$${formatNumber(66864.29, 'USD', true)}`}
      subFixedValue={`${0.91}% ${t('APR')}`}
      subFloatingValue={`${1.83}% ${t('APR')}`}
      mobileWrap
    >
      <OverviewTopPositions assets={assets} />
    </OverviewCard>
  );
};

export default EarningsOverview;
