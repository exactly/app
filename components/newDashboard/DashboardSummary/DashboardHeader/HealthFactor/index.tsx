import React, { useMemo } from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useTranslation } from 'react-i18next';

const HealthFactor = () => {
  const { t } = useTranslation();
  const { breakpoints, palette } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('lg'));

  const healthFactor = 1.092;

  const healthFactorColor = useMemo(() => {
    const status = healthFactor >= 1.05 ? 'safe' : healthFactor <= 1 ? 'danger' : 'warning';
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
          {t('Health Factor')}
        </Typography>
      </Box>
      <Typography variant={isMobile ? 'dashboardOverviewAmount' : 'h6'} color={healthFactorColor.color}>
        {healthFactor.toFixed(3)}x
      </Typography>
    </Box>
  );
};

export default HealthFactor;
