import React from 'react';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { usePageView } from 'hooks/useAnalytics';

const StrategiesContent = dynamic(() => import('components/strategies/StrategiesContent'));

const Strategies: NextPage = () => {
  usePageView('/strategies', 'Strategies');
  const { t } = useTranslation();

  return (
    <Box mt={2} maxWidth={1200} mx="auto">
      <Box>
        <Typography component="h1" variant="h5" fontSize={24} fontWeight={700}>
          {t('All Strategies')}
        </Typography>
        <Typography mt={2} fontWeight={500}>
          {t('Take control of your investments with strategies that balance risk and reward for long-term success.')}
        </Typography>
      </Box>
      <Box mt={4}>
        <StrategiesContent />
      </Box>
    </Box>
  );
};

export default Strategies;
