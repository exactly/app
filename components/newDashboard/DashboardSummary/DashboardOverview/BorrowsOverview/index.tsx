import React from 'react';
import { Box } from '@mui/material';
import ButtonWithDropdown from 'components/common/ButtonWithDropdown';
import { BorrowIcon } from 'components/Icons';
import { AssetPosition } from '../DualProgressBarPosition';
import OverviewCard from '../OverviewCard';
import OverviewPositionBars from '../OverviewPositionBars';
import formatNumber from 'utils/formatNumber';

const BorrowsOverview = () => {
  const assets: AssetPosition[] = [
    {
      symbol: 'ETH',
      fixedAssets: 1000,
      fixedValueUSD: 1000,
      floatingAssets: 1000,
      floatingValueUSD: 1000,
      percentageOfTotal: 80.51,
    },
    {
      symbol: 'WstETH',
      fixedAssets: 200,
      fixedValueUSD: 200,
      floatingAssets: 100,
      floatingValueUSD: 100,
      percentageOfTotal: 12.26,
    },
    {
      symbol: 'USDC',
      fixedAssets: 0,
      fixedValueUSD: 0,
      floatingAssets: 100,
      floatingValueUSD: 100,
      percentageOfTotal: 7.23,
    },
  ];

  return (
    <OverviewCard
      title="Your Borrows"
      icon={<BorrowIcon sx={{ fontSize: 12 }} />}
      total={`$${formatNumber(34721.95, 'USD', true)}`}
      fixedValue={`$${formatNumber(5904.03, 'USD', true)}`}
      floatingValue={`$${formatNumber(28817.92, 'USD', true)}`}
      subFixedValue={`${17.01}%`}
      subFloatingValue={`${82.99}%`}
      viewAll
      actions={
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
          <ButtonWithDropdown fullWidth>Borrow</ButtonWithDropdown>
          <ButtonWithDropdown fullWidth variant="outlined">
            Repay
          </ButtonWithDropdown>
        </Box>
      }
    >
      <OverviewPositionBars assets={assets} />
    </OverviewCard>
  );
};

export default BorrowsOverview;
