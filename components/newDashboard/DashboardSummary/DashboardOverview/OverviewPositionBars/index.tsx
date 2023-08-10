import React, { FC } from 'react';
import { Box, Typography } from '@mui/material';
import DualProgressBarPosition, { AssetPosition } from '../DualProgressBarPosition';
import { toPercentage } from 'utils/utils';

type OverviewPositionBarsProps = {
  assets?: AssetPosition[];
};

const OverviewPositionBars: FC<OverviewPositionBarsProps> = ({ assets = [] }) => {
  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      {assets.map(
        ({ symbol, decimals, fixedAssets, fixedValueUSD, floatingAssets, floatingValueUSD, percentageOfTotal }) => (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            key={`${symbol}_${fixedValueUSD}_${floatingValueUSD}`}
            gap={1}
          >
            <Typography variant="dashboardOverviewSubtitle2" minWidth={48}>
              {symbol}
            </Typography>
            <DualProgressBarPosition
              symbol={symbol}
              decimals={decimals}
              fixedValueUSD={fixedValueUSD}
              floatingValueUSD={floatingValueUSD}
              fixedAssets={fixedAssets}
              floatingAssets={floatingAssets}
              percentageOfTotal={percentageOfTotal}
            />
            <Typography variant="dashboardOverviewSubtitle2" color="figma.grey.500" minWidth={48}>
              {toPercentage(Number(percentageOfTotal) / 1e18)}
            </Typography>
          </Box>
        ),
      )}
    </Box>
  );
};

export default OverviewPositionBars;
