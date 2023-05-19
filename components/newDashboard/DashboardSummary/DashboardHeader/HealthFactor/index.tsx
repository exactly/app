import React from 'react';
import { Box, Typography } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const HealthFactor = () => {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      py={3}
      px={4}
      gap={3}
      borderRadius="8px"
      boxSizing="border-box"
      bgcolor="#FFF5F5"
      height="64px"
    >
      <Box display="flex" gap={1} alignItems="center">
        <FavoriteBorderIcon sx={{ fontSize: 16 }} />
        <Typography variant="dashboardTitle" noWrap>
          Health Factor
        </Typography>
      </Box>
      <Typography variant="dashboardMainTitle" color="#D92626">
        1.092x
      </Typography>
    </Box>
  );
};

export default HealthFactor;
