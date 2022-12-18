import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React, { useEffect } from 'react';

import Grid from '@mui/material/Grid';
import DashboardHeader from 'components/dashboard/DashboardHeader';
import OperationsModals from 'components/OperationsModal';
import { globals } from 'styles/theme';
import analytics from 'utils/analytics';

const { maxWidth } = globals;

const DashboardContent = dynamic(() => import('components/dashboard/DashboardContent'));

const DashBoard: NextPage = () => {
  useEffect(() => void analytics.page(), []);

  return (
    <>
      <OperationsModals />
      <Grid container sx={{ maxWidth, margin: 'auto' }}>
        <DashboardHeader />
      </Grid>
      <DashboardContent />
    </>
  );
};

export default DashBoard;
