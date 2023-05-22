import React from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { BorrowLimitIcon } from 'components/Icons';
import { useTranslation } from 'react-i18next';

const BorrowLimit = () => {
  const { t } = useTranslation();
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
      bgcolor="components.bg"
      height={{ xs: '73px', lg: '64px' }}
    >
      <Box display="flex" gap={1} alignItems="center">
        <BorrowLimitIcon sx={{ fontSize: 16 }} />
        <Typography variant="dashboardTitle">{t('Borrow Limit')}</Typography>
      </Box>
      <Typography variant={isMobile ? 'dashboardOverviewAmount' : 'dashboardMainTitle'}>~$3.5M</Typography>
    </Box>
  );
};

export default BorrowLimit;
