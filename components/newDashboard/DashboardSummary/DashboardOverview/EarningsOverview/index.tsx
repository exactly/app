import React from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import ButtonWithDropdown from 'components/common/ButtonWithDropdown';
import PaidIcon from '@mui/icons-material/Paid';
import OverviewCard from '../OverviewCard';
import formatNumber from 'utils/formatNumber';
import OverviewTopPositions, { TopAssetPosition } from '../OverviewTopPositions';

const EarningsOverview = () => {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('lg'));

  const assets: TopAssetPosition[] = [
    {
      symbol: 'WETH',
      type: 'fixed',
      totalUSD: `$${formatNumber(96000, 'noDecimals')}`,
      apr: `${(1.66).toFixed(2)}%`,
    },
    {
      symbol: 'WBTC',
      type: 'floating',
      totalUSD: `$${formatNumber(113000, 'noDecimals')}`,
      apr: `${(1.37).toFixed(2)}%`,
    },
    {
      symbol: 'USDC',
      type: 'floating',
      totalUSD: `$${formatNumber(68000, 'noDecimals')}`,
      apr: `${(0.93).toFixed(2)}%`,
    },
    {
      symbol: 'DAI',
      type: 'floating',
      totalUSD: `$${formatNumber(51000, 'noDecimals')}`,
      apr: `${(1.26).toFixed(2)}%`,
    },
  ];

  return (
    <OverviewCard
      title="Your Earnings"
      icon={<PaidIcon sx={{ fontSize: 16 }} />}
      total={`$${formatNumber(151318.03, isMobile ? 'noDecimals' : 'USD', !isMobile)}`}
      subTotal={
        <Box display="flex" flex="nowrap" alignItems="baseline">
          <Typography variant="dashboardOverviewAmount" fontWeight={400} color="figma.grey.500">
            2.32
          </Typography>
          <Typography fontSize={18} fontWeight={500} color="figma.grey.500">
            % APR
          </Typography>
        </Box>
      }
      fixedValue={`$${formatNumber(84453.74, 'USD', true)}`}
      floatingValue={`$${formatNumber(66864.29, 'USD', true)}`}
      subFixedValue={`${0.91}% APR`}
      subFloatingValue={`${1.83}% APR`}
      actions={
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
          <ButtonWithDropdown fullWidth>Borrow</ButtonWithDropdown>
          <ButtonWithDropdown fullWidth variant="outlined">
            Repay
          </ButtonWithDropdown>
        </Box>
      }
    >
      <OverviewTopPositions assets={assets} />
    </OverviewCard>
  );
};

export default EarningsOverview;
