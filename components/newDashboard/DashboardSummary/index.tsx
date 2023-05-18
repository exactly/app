import React from 'react';
import { Box } from '@mui/material';
import DashboardTitle from '../DashboardTitle';
import DashboardHeader from '../DashboardHeader';

const DashboardSummary = () => {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <DashboardTitle />
      <DashboardHeader />
    </Box>
  );
};

export default DashboardSummary;
