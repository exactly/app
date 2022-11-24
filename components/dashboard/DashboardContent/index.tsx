import React from 'react';
import dynamic from 'next/dynamic';
import Grid from '@mui/material/Grid';
import { globals } from 'styles/theme';

const { maxWidth } = globals;

// const DashboardUserCharts = dynamic(() => import('components/DashboardContent/DashboardUserCharts'));
const FloatingPoolDashboard = dynamic(() => import('components/dashboard/DashboardContent/FloatingPoolDashboard'));
const MaturityPoolDashboard = dynamic(() => import('components/dashboard/DashboardContent/MaturityPoolDashboard'));
const EmptyState = dynamic(() => import('components/EmptyState'));

import { useWeb3Context } from 'contexts/Web3Context';
import DashboardTabs from 'components/dashboard/DashboardContent/DashboardTabs';
import { HealthFactor } from 'types/HealthFactor';

type Props = {
  healthFactor?: HealthFactor;
};

function DashboardContent({ healthFactor }: Props) {
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
          <FloatingPoolDashboard type="deposit" healthFactor={healthFactor} />
          <MaturityPoolDashboard type="deposit" />
        </>
      ) : (
        <EmptyState />
      ),
    },
    {
      ...borrowTab,
      content: walletAddress ? (
        <>
          <FloatingPoolDashboard type="borrow" healthFactor={healthFactor} />
          <MaturityPoolDashboard type="borrow" />
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
