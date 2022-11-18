import React from 'react';

import AddETokensButton from 'components/AddETokensButton';

import FloatingPoolDashboardTable from 'components/dashboard/DashboardContent/FloatingPoolDashboard/FloatingPoolDashboardTable';
import { Grid, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import { HealthFactor } from 'types/HealthFactor';

type Props = {
  type: 'deposit' | 'borrow';
  healthFactor?: HealthFactor;
};

function FloatingPoolDashboard({ type, healthFactor }: Props) {
  return (
    <Grid width={'100%'} my={4} padding={2} sx={{ boxShadow: '#A7A7A7 0px 0px 4px 0px', borderRadius: '5px' }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="h5">Variable Rate Pools</Typography>
        <AddETokensButton />
      </Stack>
      <FloatingPoolDashboardTable type={type} healthFactor={healthFactor} />
    </Grid>
  );
}

export default FloatingPoolDashboard;
