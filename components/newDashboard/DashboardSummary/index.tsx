import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import DashboardHeader from './DashboardHeader';
import DashboardTitle from './DashboardTitle';
import DashboardOverview from './DashboardOverview';
import Legends from './Legends';
import useTotalsUsd from 'hooks/useTotalsUsd';
import StartEarning from 'components/common/StartEarning';
import useAccountData from 'hooks/useAccountData';

const DashboardSummary = () => {
  const { accountData } = useAccountData();
  const { totalBorrowedUSD, totalDepositedUSD } = useTotalsUsd();

  const loading = useMemo(() => !accountData, [accountData]);

  const isNewUser = useMemo(
    () => totalBorrowedUSD === 0n && totalDepositedUSD === 0n,
    [totalBorrowedUSD, totalDepositedUSD],
  );

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={2}
      sx={{ filter: 'drop-shadow(0px 3px 4px rgba(97, 102, 107, 0.1))' }}
    >
      {!loading && isNewUser ? <StartEarning /> : <DashboardTitle />}
      <Box display="flex" flexDirection="column" gap={2} sx={{ opacity: isNewUser ? 0.5 : 1 }}>
        <DashboardHeader />
        <DashboardOverview />
        <Legends />
      </Box>
    </Box>
  );
};

export default DashboardSummary;
