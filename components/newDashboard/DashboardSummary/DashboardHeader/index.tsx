import React from 'react';
import { Grid } from '@mui/material';
import HealthFactor from './HealthFactor';
import UserRewards from './UserRewards';
import BorrowLimit from './BorrowLimit';

const DashboardHeader = () => {
  return (
    <Grid container spacing={2} sx={{ filter: 'drop-shadow(0px 3px 4px rgba(97, 102, 107, 0.1))' }}>
      <Grid item xs={3}>
        <HealthFactor />
      </Grid>
      <Grid item xs={6}>
        <UserRewards />
      </Grid>
      <Grid item xs={3}>
        <BorrowLimit />
      </Grid>
    </Grid>
  );
};

export default DashboardHeader;
