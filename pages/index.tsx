import React, { useEffect } from 'react';
import type { NextPage } from 'next';
import Grid from '@mui/material/Grid';

import MarketsHeader from 'components/markets/Header';
import MarketTables from 'components/markets/MarketsTables';

import analytics from 'utils/analytics';

const Markets: NextPage = () => {
  useEffect(() => void analytics.page(), []);

  return (
    <Grid>
      <MarketsHeader />
      <MarketTables />
    </Grid>
  );
};

export default Markets;
