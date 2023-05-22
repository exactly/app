import React from 'react';
import { Grid, useMediaQuery, useTheme } from '@mui/material';
import HealthFactor from './HealthFactor';
import UserRewards from './UserRewards';
import BorrowLimit from './BorrowLimit';

const DashboardHeader = () => {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('lg'));

  return (
    <Grid container spacing={2} sx={{ filter: 'drop-shadow(0px 3px 4px rgba(97, 102, 107, 0.1))' }}>
      <Grid item xs={12} lg={3}>
        <HealthFactor />
      </Grid>
      <Grid item xs={12} lg={6}>
        {isMobile ? <BorrowLimit /> : <UserRewards />}
      </Grid>
      <Grid item xs={12} lg={3}>
        {isMobile ? <UserRewards /> : <BorrowLimit />}
      </Grid>
    </Grid>
  );
};

export default DashboardHeader;
