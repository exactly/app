import React from 'react';
import { Grid } from '@mui/material';
import DepositsOverview from './DepositsOverview';
import BorrowsOverview from './BorrowsOverview';
import EarningsOverview from './EarningsOverview';

const DashboardOverview = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={4}>
        <DepositsOverview />
      </Grid>
      <Grid item xs={12} lg={4}>
        <BorrowsOverview />
      </Grid>
      <Grid item xs={12} lg={4}>
        <EarningsOverview />
      </Grid>
    </Grid>
  );
};

export default DashboardOverview;
