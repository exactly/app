import React from 'react';

import AddETokensButton from 'components/AddETokensButton';

import FloatingPoolDashboardTable from 'components/dashboard/DashboardContent/FloatingPoolDashboard/FloatingPoolDashboardTable';
import { Grid, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import useDashboard from 'hooks/useDashboard';

type Props = {
  type: 'deposit' | 'borrow';
};

function FloatingPoolDashboard({ type }: Props) {
  const { floatingRows } = useDashboard(type);

  return (
    <Grid
      width={'100%'}
      my={4}
      p="24px"
      boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)"
      borderRadius="0px 0px 6px 6px"
      bgcolor="white"
      borderTop="4px solid #34C53A"
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="h6">Variable Interest Rate</Typography>
        <AddETokensButton />
      </Stack>
      <FloatingPoolDashboardTable rows={floatingRows} type={type} />
    </Grid>
  );
}

export default FloatingPoolDashboard;
