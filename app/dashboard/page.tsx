'use client';

import React from 'react';
import type { NextPage } from 'next';
import { Grid } from '@mui/material';
import dynamic from 'next/dynamic';

import DashboardHeader from 'components/dashboard/DashboardHeader';
import { usePageView } from 'hooks/useAnalytics';

const DashboardContent = dynamic(() => import('components/dashboard/DashboardContent'));

const DashBoard: NextPage = () => {
  usePageView();

  return (
    <Grid>
      <DashboardHeader />
      <DashboardContent />
    </Grid>
  );
};

export default DashBoard;
