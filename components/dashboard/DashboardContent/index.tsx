import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Grid from '@mui/material/Grid';

const FloatingPoolDashboard = dynamic(() => import('components/dashboard/DashboardContent/FloatingPoolDashboard'));
const FixedPoolDashboard = dynamic(() => import('components/dashboard/DashboardContent/FixedPoolDashboard'));

import DashboardTabs from 'components/dashboard/DashboardContent/DashboardTabs';
import { Box, useMediaQuery } from '@mui/material';
import MobileTabs from 'components/MobileTabs';
import DashboardMobile from './DashboardMobile';
import ConnectYourWallet from './ConnectYourWallet';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import useRouter from 'hooks/useRouter';
import useReadOnly from 'hooks/useReadOnly';
import { useConnection } from 'wagmi';

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

  const { isImpersonating: impersonateActive } = useReadOnly();
  const { isConnected } = useConnection();
  const theme = useTheme();
  const { query } = useRouter();
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('md'));

  const tabType = query.tab === 'b' ? 1 : 0;

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

  if (!isConnected && !impersonateActive) {
    return <ConnectYourWallet />;
  }

  if (isMobileOrTablet) {
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
      <DashboardTabs initialTab={allTabs[tabType].value} allTabs={allTabs} />
    </Grid>
  );
}

export default DashboardContent;
