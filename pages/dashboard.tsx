import React from 'react';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

import Grid from '@mui/material/Grid';
import { usePageView } from 'hooks/useAnalytics';
import DashboardSummary from 'components/newDashboard/DashboardSummary';

const DashboardContent = dynamic(() => import('components/dashboard/DashboardContent'));

const DashBoard: NextPage = () => {
  usePageView('/dashboard', 'Dashboard');

  return (
    <Grid>
      <DashboardSummary />
      <DashboardContent />
    </Grid>
  );
};

export default DashBoard;
