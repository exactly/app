import React from 'react';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

import Navbar from 'components/Navbar';
import MobileNavbar from 'components/MobileNavbar';
import DashboardHeader from 'components/DashboardHeader';
import OperationsModals from 'components/OperationsModal';
import { globals } from 'styles/theme';
import Grid from '@mui/material/Grid';

const { maxWidth } = globals;

const DashboardContent = dynamic(() => import('components/DashboardContent'));
const DashBoard: NextPage = () => {
  return (
    <>
      <OperationsModals />
      <MobileNavbar />
      <Navbar />
      <Grid container sx={{ maxWidth: maxWidth, margin: 'auto', marginTop: '130px' }}>
        <DashboardHeader />
      </Grid>
      <DashboardContent />
    </>
  );
};

export default DashBoard;
