import React, { useEffect } from 'react';
import type { NextPage } from 'next';
import Grid from '@mui/material/Grid';

import MarketsHeader from 'components/markets/Header';
import MarketTables from 'components/markets/MarketsTables';

import analytics from 'utils/analytics';
import YieldChart from 'components/charts/YieldChart';
import { Box } from '@mui/material';

const Markets: NextPage = () => {
  useEffect(() => void analytics.page(), []);

  return (
    <Grid>
      <MarketsHeader />
      <MarketTables />
      <Box width={1250} height={500} my={2}>
        <YieldChart />
      </Box>
    </Grid>
  );
};

export default Markets;
