import React, { FC } from 'react';

import FloatingPoolInfo from './FloatingPoolInfo';
import { Box, Grid } from '@mui/material';
import HistoricalRateChart from 'components/charts/HistoricalRateChart';
import UtilizationRateChart from 'components/charts/UtilizationRateChart';

type AssetFloatingPoolProps = {
  symbol: string;
};

const AssetFloatingPool: FC<AssetFloatingPoolProps> = ({ symbol }) => {
  return (
    <Box display="flex" flexDirection="column" gap="8px">
      <Grid
        item
        xs={12}
        width="100%"
        boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 4px 12px rgba(175, 177, 182, 0.2)' : '')}
        borderRadius="0px 0px 6px 6px"
        bgcolor="components.bg"
        borderTop="4px solid #33CC59"
      >
        <FloatingPoolInfo symbol={symbol} />
      </Grid>
      <Box
        boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 4px 12px rgba(175, 177, 182, 0.2)' : '')}
        borderRadius="0px 0px 6px 6px"
        bgcolor="components.bg"
        p="16px"
        height={280}
      >
        <HistoricalRateChart symbol={symbol} />
      </Box>
      <Box
        boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 4px 12px rgba(175, 177, 182, 0.2)' : '')}
        borderRadius="0px 0px 6px 6px"
        bgcolor="components.bg"
        p="16px"
      >
        <UtilizationRateChart type="floating" symbol={symbol} />
      </Box>
    </Box>
  );
};

export default AssetFloatingPool;
