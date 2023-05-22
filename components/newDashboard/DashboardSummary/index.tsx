import React from 'react';
import { Box } from '@mui/material';
import DashboardHeader from './DashboardHeader';
import DashboardTitle from './DashboardTitle';
import DashboardOverview from './DashboardOverview';
import Legends from './Legends';

const DashboardSummary = () => {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <DashboardTitle />
      <DashboardHeader />
      <DashboardOverview />
      <Legends />
    </Box>
  );
};

export default DashboardSummary;
