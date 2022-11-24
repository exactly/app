import React from 'react';
import dynamic from 'next/dynamic';

const EmptyState = dynamic(() => import('components/EmptyState'));

import { Grid, Typography } from '@mui/material';
import MaturityPoolDashboardTable from 'components/dashboard/DashboardContent/MaturityPoolDashboard/MaturityPoolDashboardTable';
import useMaturityPools from 'hooks/useMaturityPools';

type Props = {
  type: 'deposit' | 'borrow';
};

function MaturityPoolDashboard({ type }: Props) {
  const { deposits, borrows } = useMaturityPools();

  return (
    <Grid width={'100%'} my={4} padding={2} sx={{ boxShadow: '#A7A7A7 0px 0px 4px 0px', borderRadius: '5px' }}>
      <Typography variant="h5">Fixed Rate Pools</Typography>
      {type && <MaturityPoolDashboardTable maturities={type === 'deposit' ? deposits : borrows} type={type} />}
      {type === 'deposit' && !deposits && <EmptyState connected tab={type} />}
      {type === 'borrow' && !borrows && <EmptyState connected tab={type} />}
    </Grid>
  );
}

export default MaturityPoolDashboard;
