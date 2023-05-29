import React, { useMemo } from 'react';
import { Grid, useMediaQuery, useTheme } from '@mui/material';
import HealthFactor from './HealthFactor';
import UserRewards from './UserRewards';
import BorrowLimit from './BorrowLimit';

const DashboardHeader = () => {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('lg'));

  const rewards = useMemo(
    () => [
      // {
      //   assetSymbol: 'USDC',
      //   amount: 932,
      //   amountInUSD: 2575.48,
      // },
      {
        assetSymbol: 'OP',
        amount: 349,
        amountInUSD: 689.56,
      },
    ],
    [],
  );

  return (
    <Grid container spacing={2} sx={{ filter: 'drop-shadow(0px 3px 4px rgba(97, 102, 107, 0.1))' }}>
      <Grid item xs={12} lg={rewards.length > 1 ? 3 : 4}>
        <HealthFactor />
      </Grid>
      <Grid item xs={12} lg={rewards.length > 1 ? 6 : 4}>
        {isMobile ? <BorrowLimit /> : <UserRewards rewards={rewards} />}
      </Grid>
      <Grid item xs={12} lg={rewards.length > 1 ? 3 : 4}>
        {isMobile ? <UserRewards rewards={rewards} /> : <BorrowLimit />}
      </Grid>
    </Grid>
  );
};

export default DashboardHeader;
