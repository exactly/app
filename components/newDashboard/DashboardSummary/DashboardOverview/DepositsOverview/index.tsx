import React from 'react';
import { Box } from '@mui/material';
import ButtonWithDropdown from 'components/common/ButtonWithDropdown';
import { DepositIcon } from 'components/Icons';
import { AssetPosition } from '../DualProgressBarPosition';
import OverviewCard from '../OverviewCard';
import OverviewPositionBars from '../OverviewPositionBars';
import formatNumber from 'utils/formatNumber';
import { useTranslation } from 'react-i18next';

const DepositsOverview = () => {
  const { t } = useTranslation();

  const assets: AssetPosition[] = [
    {
      symbol: 'DAI',
      fixedAssets: 2000,
      fixedValueUSD: 2000,
      floatingAssets: 1000,
      floatingValueUSD: 1000,
      percentageOfTotal: 32.41,
    },
    {
      symbol: 'USDC',
      fixedAssets: 1800,
      fixedValueUSD: 1800,
      floatingAssets: 1000,
      floatingValueUSD: 1000,
      percentageOfTotal: 30.93,
    },
    {
      symbol: 'ETH',
      fixedAssets: 1000,
      fixedValueUSD: 1000,
      floatingAssets: 1000,
      floatingValueUSD: 1000,
      percentageOfTotal: 22.32,
    },
    {
      symbol: 'WBTC',
      fixedAssets: 1000,
      fixedValueUSD: 1000,
      floatingAssets: 1000,
      floatingValueUSD: 1000,
      percentageOfTotal: 9.1,
    },
    {
      symbol: 'WstETH',
      fixedAssets: 1000,
      fixedValueUSD: 1000,
      floatingAssets: 1000,
      floatingValueUSD: 1000,
      percentageOfTotal: 5.23,
    },
  ];

  return (
    <OverviewCard
      title={t('Total Deposits')}
      icon={<DepositIcon sx={{ fontSize: 12 }} />}
      total={`$${formatNumber(560432.51, 'USD', true)}`}
      fixedValue={`$${formatNumber(134003.41, 'USD', true)}`}
      floatingValue={`$${formatNumber(426429.1, 'USD', true)}`}
      subFixedValue={`${23.91}%`}
      subFloatingValue={`${76.08}%`}
      viewAll
      actions={
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
          <ButtonWithDropdown fullWidth>{t('Deposit')}</ButtonWithDropdown>
          <ButtonWithDropdown fullWidth variant="outlined">
            {t('Withdraw')}
          </ButtonWithDropdown>
        </Box>
      }
    >
      <OverviewPositionBars assets={assets} />
    </OverviewCard>
  );
};

export default DepositsOverview;
