import React from 'react';
import type { NextPage } from 'next';
import Grid from '@mui/material/Grid';

import Navbar from 'components/Navbar';
import MobileNavbar from 'components/MobileNavbar';
import OperationsModals from 'components/OperationsModal';
import MarketsHeader from 'components/markets/Header';
import MarketTables from 'components/markets/MarketsTables';

import { globals } from 'styles/theme';

const { maxWidth } = globals;
const Pools: NextPage = () => {
  return (
    <>
      <OperationsModals />
      <MobileNavbar />
      <Navbar />
      <Grid container sx={{ maxWidth: maxWidth, margin: 'auto', marginTop: '130px' }}>
        <MarketsHeader />
      </Grid>
      <MarketTables />
    </>
  );
};

export default Pools;
