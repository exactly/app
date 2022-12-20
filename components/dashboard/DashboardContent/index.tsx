import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Grid from '@mui/material/Grid';
import { globals } from 'styles/theme';

const { onlyMobile, onlyDesktop } = globals;

// const DashboardUserCharts = dynamic(() => import('components/DashboardContent/DashboardUserCharts'));
const FloatingPoolDashboard = dynamic(() => import('components/dashboard/DashboardContent/FloatingPoolDashboard'));
const FixedPoolDashboard = dynamic(() => import('components/dashboard/DashboardContent/FixedPoolDashboard'));

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
  const { isConnected } = useWeb3();

  const allTabs = useMemo(
    () => [
      {
        ...depositTab,
        content: (
          <>
            <FloatingPoolDashboard type="deposit" />
            <FixedPoolDashboard type="deposit" />
          </>
        ),
      },
      {
        ...borrowTab,
        content: (
          <>
            <FloatingPoolDashboard type="borrow" />
            <FixedPoolDashboard type="borrow" />
          </>
        ),
      },
    ],
    [],
  );

  if (!isConnected) {
    return <ConnectYourWallet />;
  }

  return (
    <>
      <Grid mt={5} display={onlyDesktop}>
        <DashboardTabs initialTab={allTabs[0].value} allTabs={allTabs} />
      </Grid>
      <Box display={onlyMobile} my={2}>
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
