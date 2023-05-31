import React, { FC } from 'react';
import { Box, Grid, Typography } from '@mui/material';
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
          <Grid
            display="flex"
            alignItems="center"
            justifyContent="center"
            key={`${symbol}_${fixedValueUSD}_${floatingValueUSD}`}
          >
            <Grid item xs={2}>
              <Typography variant="dashboardOverviewSubtitle2" textTransform="uppercase">
                {symbol}
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <DualProgressBarPosition
                symbol={symbol}
                decimals={decimals}
                fixedValueUSD={fixedValueUSD}
                floatingValueUSD={floatingValueUSD}
                fixedAssets={fixedAssets}
                floatingAssets={floatingAssets}
                percentageOfTotal={percentageOfTotal}
              />
            </Grid>
            <Grid item xs={2} textAlign="right">
              <Typography variant="dashboardOverviewSubtitle2" color="figma.grey.500">
                {toPercentage(Number(percentageOfTotal) / 1e18)}
              </Typography>
            </Grid>
          </Grid>
        ),
      )}
    </Box>
  );
};

export default OverviewPositionBars;
