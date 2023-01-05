import React, { FC } from 'react';

import FloatingPoolInfo from './FloatingPoolInfo';
import { Box, Grid } from '@mui/material';
import HistoricalRateChart from 'components/charts/HistoricalRateChart';
import { globals } from 'styles/theme';
import useAccountData from 'hooks/useAccountData';
import UtilizationRateChart from 'components/charts/UtilizationRateChart';

const { onlyDesktop } = globals;

type AssetFloatingPoolProps = {
  symbol: string;
};

const AssetFloatingPool: FC<AssetFloatingPoolProps> = ({ symbol }) => {
  const { market, floatingUtilization, floatingBorrowRate, interestRateModel } = useAccountData(symbol);
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
        <FloatingPoolInfo symbol={symbol} eMarketAddress={market} />
      </Grid>
      <Box
        boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)"
        borderRadius="0px 0px 6px 6px"
        bgcolor="white"
        p="16px"
        display={onlyDesktop} // TODO: are we going to have it on mobile?
        width={610}
        height={280}
      >
        <HistoricalRateChart symbol={symbol} />
      </Box>
      <Box
        boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)"
        borderRadius="0px 0px 6px 6px"
        bgcolor="white"
        p="16px"
        display={onlyDesktop} // TODO: are we going to have it on mobile?
        width={610}
        height={280}
      >
        <UtilizationRateChart
          type="floating"
          current={[floatingUtilization, floatingBorrowRate]}
          interestRateModel={interestRateModel}
        />
        <HistoricalRateChart symbol={symbol} />
      </Box>
    </Box>
  );
};

export default AssetFloatingPool;
