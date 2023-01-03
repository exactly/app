import React from 'react';
import { Grid, Typography } from '@mui/material';

import FixedPoolDashboardTable from 'components/dashboard/DashboardContent/FixedPoolDashboard/FixedPoolDashboardTable';
import useDashboard from 'hooks/useDashboard';

type Props = {
  type: 'deposit' | 'borrow';
};

function FixedPoolDashboard({ type }: Props) {
  const { fixedRows } = useDashboard(type);

  return (
    <Grid
      width={'100%'}
      mb="16px"
      p="24px"
      boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)"
      borderRadius="0px 0px 6px 6px"
      bgcolor="white"
      borderTop="4px solid #008CF4"
    >
      <Typography variant="h6">Fixed Interest Rate</Typography>
      {fixedRows.length === 0 ? (
        <Typography color="grey.500" mt={1} fontSize="14px">
          No {type}s found
        </Typography>
      ) : (
        <FixedPoolDashboardTable rows={fixedRows} type={type} />
      )}
    </Grid>
  );
}

export default FixedPoolDashboard;
