import React from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const HealthFactor = () => {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('lg'));

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      py={2}
      px={4}
      gap={3}
      borderRadius="8px"
      boxSizing="border-box"
      bgcolor="#FFF5F5"
      height={{ xs: '73px', lg: '64px' }}
    >
      <Box display="flex" gap={1} alignItems="center">
        <FavoriteBorderIcon sx={{ fontSize: 16 }} />
        <Typography variant="dashboardTitle" noWrap>
          Health Factor
        </Typography>
      </Box>
      <Typography variant={isMobile ? 'dashboardOverviewAmount' : 'dashboardMainTitle'} color="#D92626">
        1.092x
      </Typography>
    </Box>
  );
};

export default HealthFactor;
