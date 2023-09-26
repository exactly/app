import React from 'react';
import { Grid } from '@mui/material';

import StrategyCard, { type Props as Strategy } from 'components/strategies/StrategyCard';

type Props = {
  featured: Strategy[];
};

function FeaturedStrategies({ featured }: Props) {
  return (
    <Grid container spacing={3}>
      {featured.map((props, i) => (
        <Grid item sm={12} md={4} display="flex" justifyContent="center" width="100%" key={i}>
          <StrategyCard {...props} />
        </Grid>
      ))}
    </Grid>
  );
}

export default React.memo(FeaturedStrategies);
