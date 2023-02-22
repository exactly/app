import React, { useContext, useEffect } from 'react';
import type { NextPage } from 'next';
import { Box, Grid } from '@mui/material';

import MarketsHeader from 'components/markets/Header';
import MarketTables from 'components/markets/MarketsTables';
import MarketsBasic from 'components/markets/MarketsBasic';
import BackgroundCircle from 'components/BackgroundCircle';

import { MarketContext } from 'contexts/MarketContext';
import analytics from 'utils/analytics';

const Markets: NextPage = () => {
  const { view } = useContext(MarketContext);
  useEffect(() => void analytics.page(), []);

  if (!view) return null;

  return (
    <Grid>
      {view === 'advanced' ? (
        <>
          <MarketsHeader />
          <MarketTables />
        </>
      ) : (
        <Box display="flex" justifyContent="center" mb={2} mt={3}>
          <MarketsBasic />
          <BackgroundCircle />
        </Box>
      )}
    </Grid>
  );
};

export default Markets;
