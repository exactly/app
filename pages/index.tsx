import React, { useEffect } from 'react';
import type { NextPage } from 'next';
import Grid from '@mui/material/Grid';

import MobileNavbar from 'components/MobileNavbar';
import OperationsModal from 'components/OperationsModal';
import MarketsHeader from 'components/markets/Header';
import MarketTables from 'components/markets/MarketsTables';

import { globals } from 'styles/theme';
import analytics from 'utils/analytics';

const { maxWidth } = globals;

const Markets: NextPage = () => {
  useEffect(() => void analytics.page(), []);

  return (
    <>
      <OperationsModal />
      <MobileNavbar />
      <Grid container sx={{ maxWidth: maxWidth, margin: 'auto' }}>
        <MarketsHeader />
      </Grid>
      <MarketTables />
    </>
  );
};

export default Markets;
