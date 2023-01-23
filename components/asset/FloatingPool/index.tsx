import React, { FC } from 'react';
import Grid from '@mui/material/Grid';

import FloatingPoolInfo from './FloatingPoolInfo';
import { Box } from '@mui/material';
import HistoricalRateChart from 'components/charts/HistoricalRateChart';
import { globals } from 'styles/theme';

const { onlyDesktop } = globals;

type AssetFloatingPoolProps = {
  symbol: string;
  eMarketAddress?: string;
};

const AssetFloatingPool: FC<AssetFloatingPoolProps> = ({ symbol, eMarketAddress }) => {
  return (
    <Box display="flex" flexDirection="column" gap="8px">
      <Grid
        item
        xs={12}
        width="100%"
        boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)"
        borderRadius="0px 0px 6px 6px"
        bgcolor="white"
        borderTop="4px solid #33CC59"
      >
        <FloatingPoolInfo symbol={symbol} eMarketAddress={eMarketAddress} />
      </Grid>
      <Box
        boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)"
        borderRadius="0px 0px 6px 6px"
        bgcolor="white"
        p="16px"
        display={onlyDesktop} // TODO: are we going to have it on mobile?
        width={610}
        height={350}
      >
        <HistoricalRateChart symbol={symbol} />
      </Box>
    </Box>
  );
};

export default AssetFloatingPool;
