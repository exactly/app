import React from 'react';
import dynamic from 'next/dynamic';

const EmptyState = dynamic(() => import('components/EmptyState'));

import { Grid, Typography } from '@mui/material';
import FixedPoolDashboardTable from 'components/dashboard/DashboardContent/FixedPoolDashboard/FixedPoolDashboardTable';
import useFixedPools from 'hooks/useFixedPools';

type Props = {
  type: 'deposit' | 'borrow';
};

function FixedPoolDashboard({ type }: Props) {
  const { deposits, borrows } = useFixedPools();

  return (
    <Grid width={'100%'} my={4} padding={2} sx={{ boxShadow: '#A7A7A7 0px 0px 4px 0px', borderRadius: '5px' }}>
      <Typography variant="h5">Fixed Interest Rate</Typography>
      {type && <FixedPoolDashboardTable fixedPools={type === 'deposit' ? deposits : borrows} type={type} />}
      {type === 'deposit' && !deposits && <EmptyState connected tab={type} />}
      {type === 'borrow' && !borrows && <EmptyState connected tab={type} />}
    </Grid>
  );
}

export default FixedPoolDashboard;
