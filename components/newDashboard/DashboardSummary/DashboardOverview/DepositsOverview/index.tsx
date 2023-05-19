import React from 'react';
import { Box } from '@mui/material';
import ButtonWithDropdown from 'components/common/ButtonWithDropdown';
import { DepositIcon } from 'components/Icons';
import { AssetPosition } from '../DualProgressBarPosition';
import OverviewCard from '../OverviewCard';
import OverviewPositionBars from '../OverviewPositionBars';

const DepositsOverview = () => {
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
      title="Your Deposits"
      icon={<DepositIcon sx={{ fontSize: 12 }} />}
      fixedValue={134003.41}
      floatingValue={426429.1}
      actions={
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
          <ButtonWithDropdown fullWidth>Deposit</ButtonWithDropdown>
          <ButtonWithDropdown fullWidth variant="outlined">
            Withdraw
          </ButtonWithDropdown>
        </Box>
      }
    >
      <OverviewPositionBars assets={assets} />
    </OverviewCard>
  );
};

export default DepositsOverview;
