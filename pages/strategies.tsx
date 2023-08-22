import React from 'react';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { Alert, Box, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';

import { usePageView } from 'hooks/useAnalytics';

const StrategiesContent = dynamic(() => import('components/strategies/StrategiesContent'));

const Strategies: NextPage = () => {
  usePageView('/strategies', 'Strategies');
  const { t } = useTranslation();

  return (
    <Box mt={2} maxWidth={1200} mx="auto">
      <Alert severity="info" sx={{ mb: 2 }}>
        <Trans
          i18nKey={
            'Due to a recent report in Balancer vaults, used by our strategies, these features are temporarily disabled. <1>More info</1>.'
          }
          components={{
            1: (
              <a
                href="https://twitter.com/Balancer/status/1694014645378724280"
                rel="noreferrer"
                target="_blank"
                style={{ textDecoration: 'underline' }}
              />
            ),
          }}
        />
      </Alert>
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
