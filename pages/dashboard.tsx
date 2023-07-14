import React from 'react';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

import Grid from '@mui/material/Grid';
import DashboardHeader from 'components/dashboard/DashboardHeader';
import { usePageView } from 'hooks/useAnalytics';

const DashboardContent = dynamic(() => import('components/dashboard/DashboardContent'));

const DashBoard: NextPage = () => {
  usePageView('/dashboard', 'Dashboard');

  return (
    <Grid>
      <DashboardHeader />
      <DashboardContent />
    </Grid>
  );
};

export default DashBoard;
