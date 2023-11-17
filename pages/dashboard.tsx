import React from 'react';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

import Grid from '@mui/material/Grid';
import DashboardSummary from 'components/newDashboard/DashboardSummary';

const DashboardContent = dynamic(() => import('components/dashboard/DashboardContent'));

const DashBoard: NextPage = () => {
  return (
    <Grid>
      <DashboardSummary />
      <DashboardContent />
    </Grid>
  );
};

export default DashBoard;
