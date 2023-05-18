import type { NextPage } from 'next';
import React from 'react';

import Grid from '@mui/material/Grid';
import DashboardSummary from 'components/newDashboard/DashboardSummary';

const Dashboard: NextPage = () => {
  return (
    <Grid mt={4}>
      <DashboardSummary />
    </Grid>
  );
};

export default Dashboard;
