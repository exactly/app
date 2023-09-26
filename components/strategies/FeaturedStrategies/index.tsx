import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Grid } from '@mui/material';

import StrategyCard, { type Props as Strategy } from 'components/strategies/StrategyCard';
import { useStartDebtManagerButton, useStartLeverager } from 'hooks/useActionButton';

function FeaturedStrategies() {
  const { t } = useTranslation();

  const { startLeverager } = useStartLeverager();
  const { startDebtManager } = useStartDebtManagerButton();

  const strategies = useMemo<Strategy[]>(
    () => [
      {
        title: t('Maximize your yield'),
        description: t('Amplify gains or mitigate risk with the power of leverage and deleverage in your investments.'),
        tags: [
          { prefix: t('up to'), text: '48.16 APR' },
          { text: t('Advanced'), size: 'small' as const },
        ],
        button: (
          <Button fullWidth variant="contained" onClick={() => startLeverager()}>
            {t('Leverage')}
          </Button>
        ),
        isNew: true,
        source: 'exactly',
        imgPath: '/img/strategies/featured_leverage.svg',
      },
      {
        title: t('Refinance Loans'),
        description: t(
          'Seamlessly transfer your debt positions between different pools or convert from fixed to variable rates, and vice versa.',
        ),
        tags: [
          { prefix: t('FROM'), text: '1.83% APR' },
          { text: t('Basic'), size: 'small' as const },
        ],
        button: (
          <Button fullWidth variant="contained" onClick={() => startDebtManager({})}>
            {t('Rollover')}
          </Button>
        ),
        isNew: true,
        source: 'exactly',
        imgPath: '/img/strategies/featured_rollover.svg',
      },
      {
        title: t('Deposit EXA on Extra Finance'),
        description: t('Deposit EXA on Extra Finance and earn interest on it.'),
        tags: [
          { prefix: t('up to'), text: '48.16 APR' },
          { text: t('Basic'), size: 'small' as const },
        ],
        button: (
          <a href="https://app.extrafi.io/lend/EXA" target="_blank" rel="noreferrer noopener" style={{ width: '100%' }}>
            <Button fullWidth variant="contained">
              {t('Go to Extra Finance')}
            </Button>
          </a>
        ),
        source: 'third-party',
        imgPath: '/img/strategies/featured_extra.svg',
      },
    ],
    [startDebtManager, startLeverager, t],
  );

  return (
    <Grid container spacing={3}>
      {strategies.map((props, i) => (
        <Grid item sm={12} md={4} display="flex" justifyContent="center" width="100%" key={i}>
          <StrategyCard {...props} />
        </Grid>
      ))}
    </Grid>
  );
}

export default React.memo(FeaturedStrategies);
