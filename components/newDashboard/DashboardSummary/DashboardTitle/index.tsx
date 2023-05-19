import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReplayIcon from '@mui/icons-material/Replay';

const DashboardTitle = () => {
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
      <Box display="flex" alignItems="center" gap={1}>
        <AssignmentIcon />
        <Typography variant="dashboardMainTitle">Summary</Typography>
      </Box>
      <Box display="flex" alignItems="center" gap={0.25}>
        <Typography variant="dashboardMainSubtitle">Updated 10 minutes ago</Typography>
        <IconButton size="small">
          <ReplayIcon sx={{ fontSize: 20, color: 'figma.grey.500' }} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default DashboardTitle;
