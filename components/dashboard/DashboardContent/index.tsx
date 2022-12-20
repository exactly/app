import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Grid from '@mui/material/Grid';
import { globals } from 'styles/theme';

const { maxWidth, onlyMobile, onlyDesktop } = globals;

// const DashboardUserCharts = dynamic(() => import('components/DashboardContent/DashboardUserCharts'));
const FloatingPoolDashboard = dynamic(() => import('components/dashboard/DashboardContent/FloatingPoolDashboard'));
const FixedPoolDashboard = dynamic(() => import('components/dashboard/DashboardContent/FixedPoolDashboard'));
const EmptyState = dynamic(() => import('components/EmptyState'));

import DashboardTabs from 'components/dashboard/DashboardContent/DashboardTabs';
import { useWeb3 } from 'hooks/useWeb3';
import { Box } from '@mui/material';
import MobileTabs from 'components/MobileTabs';
import DashboardMobile from './DashboardMobile';
import ConnectYourWallet from './ConnectYourWallet';

const depositTab = {
  label: 'Your Deposits',
  value: 'deposit',
};

const borrowTab = {
  label: 'Your Borrows',
  value: 'borrow',
};

function DashboardContent() {
  const { walletAddress, isConnected } = useWeb3();

  const allTabs = useMemo(
    () => [
      {
        ...depositTab,
        content: walletAddress ? (
          <>
            <FloatingPoolDashboard type="deposit" />
            <FixedPoolDashboard type="deposit" />
          </>
        ) : (
          <EmptyState />
        ),
      },
      {
        ...borrowTab,
        content: walletAddress ? (
          <>
            <FloatingPoolDashboard type="borrow" />
            <FixedPoolDashboard type="borrow" />
          </>
        ) : (
          <EmptyState />
        ),
      },
    ],
    [walletAddress],
  );

  if (!isConnected) {
    return <ConnectYourWallet />;
  }

  return (
    <>
      <Grid container sx={{ maxWidth }} mx="auto" mt={5} display={onlyDesktop}>
        <DashboardTabs initialTab={allTabs[0].value} allTabs={allTabs} />
      </Grid>
      <Box display={onlyMobile} width="100%" px={1} my={2}>
        <MobileTabs
          tabs={[
            {
              title: 'Your Deposits',
              content: <DashboardMobile type="deposit" />,
            },
            {
              title: 'Your Borrows',
              content: <DashboardMobile type="borrow" />,
            },
          ]}
        />
      </Box>
    </>
  );
}

export default DashboardContent;
