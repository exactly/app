import React, { useEffect } from 'react';
import type { NextPage } from 'next';
import Grid from '@mui/material/Grid';

// import MarketsHeader from 'components/markets/Header';
// import MarketTables from 'components/markets/MarketsTables';
import MarketsBasic from 'components/markets/MarketsBasic';

import analytics from 'utils/analytics';
import { Box } from '@mui/material';

const Markets: NextPage = () => {
  useEffect(() => void analytics.page(), []);

  return (
    <Grid>
      {/* <MarketsHeader />
      <MarketTables /> */}
      <Box display="flex" justifyContent="center" mb={2}>
        <MarketsBasic />
      </Box>
    </Grid>
  );
};

export default Markets;
