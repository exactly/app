import React from 'react';
import { Box, Grid } from '@mui/material';
import HealthFactor from './HealthFactor';
import UserRewards from './UserRewards';
import BorrowLimit from './BorrowLimit';
import NetEarnings from './NetEarnings';

const DashboardHeader = () => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={4}>
        <NetEarnings />
      </Grid>
      <Grid item xs={12} lg={4}>
        <UserRewards />
      </Grid>
      <Grid item xs={12} lg={4}>
        <Box display="flex" flexDirection="column" gap={2}>
          <HealthFactor />
          <BorrowLimit />
        </Box>
      </Grid>
    </Grid>
  );
};

export default DashboardHeader;
