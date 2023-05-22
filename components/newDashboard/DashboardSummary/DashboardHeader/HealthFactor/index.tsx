import React, { useMemo } from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const HealthFactor = () => {
  const { breakpoints, palette } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('lg'));

  const healthFactor = 7.352;

  const healthFactorColor = useMemo(() => {
    const status = healthFactor < 1.005 ? 'danger' : 'safe';
    return { color: palette.healthFactor[status], bg: palette.healthFactor.bg[status] };
  }, [palette.healthFactor]);

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
      bgcolor={healthFactorColor.bg}
      height={{ xs: '73px', lg: '64px' }}
    >
      <Box display="flex" gap={1} alignItems="center">
        <FavoriteBorderIcon sx={{ fontSize: 16, color: palette.primary.main }} />
        <Typography variant="dashboardTitle" color="primary" noWrap>
          Health Factor
        </Typography>
      </Box>
      <Typography variant={isMobile ? 'dashboardOverviewAmount' : 'dashboardMainTitle'} color={healthFactorColor.color}>
        {healthFactor}x
      </Typography>
    </Box>
  );
};

export default HealthFactor;
