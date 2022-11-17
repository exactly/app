import React from 'react';
import dynamic from 'next/dynamic';
import Grid from '@mui/material/Grid';
import { globals } from 'styles/theme';

const { maxWidth } = globals;

// const DashboardUserCharts = dynamic(() => import('components/DashboardUserCharts'));
const SmartPoolDashboard = dynamic(() => import('components/SmartPoolDashboard'));
const MaturityPoolDashboard = dynamic(() => import('components/MaturityPoolDashboard'));
const EmptyState = dynamic(() => import('components/EmptyState'));

import { useWeb3Context } from 'contexts/Web3Context';
import DashboardTabs from 'components/DashboardTabs';

function DashboardContent() {
  const { walletAddress } = useWeb3Context();

  const depositTab = {
    label: 'Your Deposits',
    value: 'deposit',
  };

  const borrowTab = {
    label: 'Your Borrows',
    value: 'borrow',
  };

  const allTabs = [
    {
      ...depositTab,
      content: walletAddress ? (
        <>
          <SmartPoolDashboard type={depositTab.value as 'deposit'} />
          <MaturityPoolDashboard tab={depositTab} />
        </>
      ) : (
        <EmptyState />
      ),
    },
    {
      ...borrowTab,
      content: walletAddress ? (
        <>
          <SmartPoolDashboard type={borrowTab.value as 'borrow'} />
          <MaturityPoolDashboard tab={borrowTab} />
        </>
      ) : (
        <EmptyState />
      ),
    },
  ];

  return (
    <Grid container sx={{ maxWidth: maxWidth }} mx="auto" mt={5}>
      <DashboardTabs initialTab={allTabs[0].value} allTabs={allTabs} />
    </Grid>
  );
}

export default DashboardContent;
