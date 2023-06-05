import type { NextPage } from 'next';
import React from 'react';

import Grid from '@mui/material/Grid';
import DashboardSummary from 'components/newDashboard/DashboardSummary';
import { useWeb3 } from 'hooks/useWeb3';
import ConnectYourWallet from 'components/dashboard/DashboardContent/ConnectYourWallet';

const Dashboard: NextPage = () => {
  const { isConnected } = useWeb3();

  if (!isConnected) {
    return <ConnectYourWallet />;
  }

  return (
    <Grid mt={4}>
      <DashboardSummary />
    </Grid>
  );
};

export default Dashboard;
