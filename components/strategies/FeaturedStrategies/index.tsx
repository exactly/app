import React from 'react';
import { Grid } from '@mui/material';

import StrategyCard, { type Props as Strategy } from 'components/strategies/StrategyCard';

type Props = {
  featured: Strategy[];
};

function FeaturedStrategies({ featured }: Props) {
  return (
    <Grid container spacing={3}>
      {featured.map((strategy, i) => (
        <Grid item sm={12} md={4} display="flex" justifyContent="center" width="100%" key={`${strategy.title}-${i}`}>
          <StrategyCard {...strategy} />
        </Grid>
      ))}
    </Grid>
  );
}

export default React.memo(FeaturedStrategies);
