import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Grid from '@mui/material/Grid';

const FloatingPoolDashboard = dynamic(() => import('components/dashboard/DashboardContent/FloatingPoolDashboard'));
const FixedPoolDashboard = dynamic(() => import('components/dashboard/DashboardContent/FixedPoolDashboard'));

import DashboardTabs from 'components/dashboard/DashboardContent/DashboardTabs';
import { useWeb3 } from 'hooks/useWeb3';
import { Box, useMediaQuery } from '@mui/material';
import MobileTabs from 'components/MobileTabs';
import DashboardMobile from './DashboardMobile';
import ConnectYourWallet from './ConnectYourWallet';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

function DashboardContent() {
  const { t } = useTranslation();

  const { depositTab, borrowTab } = useMemo(
    () => ({
      depositTab: {
        label: t('Your Deposits'),
        value: 'deposit',
      },

      borrowTab: {
        label: t('Your Borrows'),
        value: 'borrow',
      },
    }),
    [t],
  );

  const { isConnected } = useWeb3();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    [borrowTab, depositTab],
  );

  if (!isConnected) {
    return <ConnectYourWallet />;
  }

  if (isMobile) {
    return (
      <Box my={2}>
        <MobileTabs
          tabs={[
            {
              title: t('Your Deposits'),
              content: <DashboardMobile type="deposit" />,
            },
            {
              title: t('Your Borrows'),
              content: <DashboardMobile type="borrow" />,
            },
          ]}
        />
      </Box>
    );
  }

  return (
    <Grid mt="24px">
      <DashboardTabs initialTab={allTabs[0].value} allTabs={allTabs} />
    </Grid>
  );
}

export default DashboardContent;
