import React from 'react';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { usePageView } from 'hooks/useAnalytics';
import { useStartLeverager } from 'hooks/useActionButton';
import StrategyRowCard from 'components/strategies/StrategyRowCard';

const FeaturedStrategies = dynamic(() => import('components/strategies/FeaturedStrategies'));

const Strategies: NextPage = () => {
  usePageView('/strategies', 'Strategies');
  const { t } = useTranslation();
  const { startLeverager } = useStartLeverager();

  const exactlyStrategies = [
    {
      title: t('Maximize your yield'),
      description: t('Amplify gains or mitigate risk with the power of leverage and deleverage in your investments.'),
      tags: [
        { prefix: t('up to'), text: '48.16 APR' },
        { text: 'Advanced', size: 'small' as const },
      ],
      button: (
        <Button fullWidth variant="contained" onClick={() => startLeverager()}>
          {t('Leverage')}
        </Button>
      ),
    },
  ];

  const thirdPartStrategies = [
    {
      title: t('Deposit EXA on Extra Finance'),
      description: t('Deposit EXA on Extra Finance and earn interest on it.'),
      tags: [
        { prefix: t('up to'), text: '48.16 APR' },
        { text: 'Basic', size: 'small' as const },
      ],
      button: (
        <a href="https://app.extrafi.io/lend/EXA" target="_blank" rel="noreferrer noopener">
          <Button fullWidth variant="contained">
            {t('Go to Extra Finance')}
          </Button>
        </a>
      ),
    },
  ];

  return (
    <Box mt={5} maxWidth={1200} mx="auto">
      <Box display="flex" flexDirection="column" gap={5}>
        <Typography component="h1" fontSize={24} fontWeight={700}>
          {t('Featured Strategies')}
        </Typography>
        <FeaturedStrategies />
      </Box>
      <Box mt={10} display="flex" flexDirection="column" gap={6}>
        <Box display="flex" flexDirection="column" gap={3}>
          <Typography component="h1" fontSize={24} fontWeight={700}>
            {t('All Strategies')}
          </Typography>
          <Typography>
            {t('Take control of your investments with strategies that balance risk and reward for long-term success.')}
          </Typography>
        </Box>
        <Box display="flex" flexDirection="column" gap={3}>
          <Typography component="h2" variant="h6">
            {t('Exactly Powered')}
          </Typography>
          <Box
            bgcolor="components.bg"
            borderRadius="8px"
            boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 3px 4px 0px rgba(97, 102, 107, 0.25)' : '')}
          >
            {exactlyStrategies.map((strategy) => (
              <StrategyRowCard key={strategy.title} {...strategy} />
            ))}
          </Box>
        </Box>
        <Box display="flex" flexDirection="column" gap={3}>
          <Typography component="h2" variant="h6">
            {t('Third-Party Powered')}
          </Typography>
          <Typography>
            {t(
              'Please be aware that these are third-party offerings. Exercise caution and do your due diligence to secure your funds.',
            )}
          </Typography>
          <Box
            bgcolor="components.bg"
            borderRadius="8px"
            boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 3px 4px 0px rgba(97, 102, 107, 0.25)' : '')}
          >
            {thirdPartStrategies.map((strategy) => (
              <StrategyRowCard key={strategy.title} {...strategy} />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Strategies;
