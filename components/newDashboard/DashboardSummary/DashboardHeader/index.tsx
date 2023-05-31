import React, { useMemo } from 'react';
import { Grid, useMediaQuery, useTheme } from '@mui/material';
import HealthFactor from './HealthFactor';
import UserRewards from './UserRewards';
import BorrowLimit from './BorrowLimit';
import useRewards from 'hooks/useRewards';

const DashboardHeader = () => {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('lg'));
  const { rewards } = useRewards();

  const rewardsQty = useMemo(() => Object.values(rewards).length, [rewards]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={rewardsQty > 1 ? 3 : 4}>
        <HealthFactor />
      </Grid>
      <Grid item xs={12} lg={rewardsQty > 1 ? 6 : 4}>
        {isMobile ? <BorrowLimit /> : <UserRewards />}
      </Grid>
      <Grid item xs={12} lg={rewardsQty > 1 ? 3 : 4}>
        {isMobile ? <UserRewards /> : <BorrowLimit />}
      </Grid>
    </Grid>
  );
};

export default DashboardHeader;
