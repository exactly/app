import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Grid } from '@mui/material';

import StrategyCard, { type Props as Strategy } from 'components/strategies/StrategyCard';
import { useStartDebtManagerButton, useStartLeverager } from 'hooks/useActionButton';

function StrategiesContent() {
  const { t } = useTranslation();

  const { startLeverager } = useStartLeverager();
  const { startDebtManager } = useStartDebtManagerButton();

  const strategies = useMemo<Strategy[]>(
    () => [
      {
        title: t('Maximize your yield'),
        description: t('Amplify gains or mitigate risk with the power of leverage and deleverage in your investments.'),
        tags: ['advanced'],
        children: (
          <Button fullWidth variant="contained" onClick={() => startLeverager()}>
            {t('Leverage')}
          </Button>
        ),
      },
      {
        title: t('Reduce exposure'),
        description: t('Reduce your risk by decreasing your investment exposure and borrowing less.'),
        tags: ['advanced'],
        children: (
          <Button fullWidth variant="contained" onClick={() => startLeverager()}>
            {t('Deleverage')}
          </Button>
        ),
      },
      {
        title: t('Refinance your loans'),
        description: t(
          'Seamlessly transfer your debt positions between different pools or convert from fixed to variable rates, and vice versa.',
        ),
        tags: ['basic'],
        children: (
          <Button fullWidth variant="contained" onClick={() => startDebtManager()}>
            {t('Rollover')}
          </Button>
        ),
      },
    ],
    [startDebtManager, startLeverager, t],
  );

  return (
    <Grid ml={-2} mt={0} container spacing={2}>
      {strategies.map((props, i) => (
        <Grid item sm={12} md={4} display="flex" justifyContent="center" width="100%" key={i}>
          <StrategyCard {...props} />
        </Grid>
      ))}
    </Grid>
  );
}

export default React.memo(StrategiesContent);
