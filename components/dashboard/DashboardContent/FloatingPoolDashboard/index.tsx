import React from 'react';

import AddETokensButton from 'components/AddETokensButton';

import FloatingPoolDashboardTable from 'components/dashboard/DashboardContent/FloatingPoolDashboard/FloatingPoolDashboardTable';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

type Props = {
  type: 'deposit' | 'borrow';
};

function FloatingPoolDashboard({ type }: Props) {
  return (
    <Grid width={'100%'} my={4} padding={2} sx={{ boxShadow: '#A7A7A7 0px 0px 4px 0px', borderRadius: '5px' }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="h5">Variable Rate Pools</Typography>
        <AddETokensButton />
      </Stack>
      <FloatingPoolDashboardTable type={type} />
    </Grid>
  );
}

export default FloatingPoolDashboard;
