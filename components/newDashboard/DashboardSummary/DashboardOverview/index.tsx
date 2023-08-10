import React from 'react';
import { Grid } from '@mui/material';
import DepositsOverview from './DepositsOverview';
import BorrowsOverview from './BorrowsOverview';

const DashboardOverview = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={6}>
        <DepositsOverview />
      </Grid>
      <Grid item xs={12} lg={6}>
        <BorrowsOverview />
      </Grid>
    </Grid>
  );
};

export default DashboardOverview;
