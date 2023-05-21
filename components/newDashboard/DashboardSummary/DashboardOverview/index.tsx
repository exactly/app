import React from 'react';
import { Grid } from '@mui/material';
import DepositsOverview from './DepositsOverview';
import BorrowsOverview from './BorrowsOverview';
import EarningsOverview from './EarningsOverview';

const DashboardOverview = () => {
  return (
    <Grid container spacing={2} sx={{ filter: 'drop-shadow(0px 3px 4px rgba(97, 102, 107, 0.1))' }}>
      <Grid item xs={4}>
        <DepositsOverview />
      </Grid>
      <Grid item xs={4}>
        <BorrowsOverview />
      </Grid>
      <Grid item xs={4}>
        <EarningsOverview />
      </Grid>
    </Grid>
  );
};

export default DashboardOverview;
