import React from 'react';
import type { NextPage } from 'next';
import Grid from '@mui/material/Grid';

import MarketsList from 'components/MarketsList';
import MaturitySelector from 'components/MaturitySelector';
import Navbar from 'components/Navbar';
import Footer from 'components/Footer';
import MobileNavbar from 'components/MobileNavbar';
import SmartPoolList from 'components/SmartPoolList';
import OperationsModals from 'components/OperationsModal';

import dictionary from 'dictionary/en.json';
import MarketsHeader from 'components/markets/Header';
import { globals } from 'styles/theme';

const { maxWidth } = globals;

const Pools: NextPage = () => {
  return (
    <>
      <OperationsModals />
      <MobileNavbar />
      <Navbar />

      <div style={{ marginTop: '180px' }}>
        <Grid container sx={{ maxWidth: maxWidth, margin: 'auto' }}>
          <MarketsHeader />
        </Grid>
        <SmartPoolList />
      </div>

      <MaturitySelector title={dictionary.maturityPools} subtitle={dictionary.maturities} />

      <MarketsList />
      <Footer />
    </>
  );
};

export default Pools;
