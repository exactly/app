import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import Grid from '@mui/material/Grid';
import DashboardHeader from 'components/dashboard/DashboardHeader';
import MobileNavbar from 'components/MobileNavbar';
import OperationsModal from 'components/OperationsModal';
import AccountDataContext from 'contexts/AccountDataContext';
import { globals } from 'styles/theme';
import getHealthFactorData from 'utils/getHealthFactorData';
import { HealthFactor } from 'types/HealthFactor';
import { useWeb3 } from 'hooks/useWeb3';
import analytics from 'utils/analytics';

const { maxWidth } = globals;

const DashboardContent = dynamic(() => import('components/dashboard/DashboardContent'));

const DashBoard: NextPage = () => {
  const { walletAddress } = useWeb3();
  const { accountData } = useContext(AccountDataContext);

  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>();

  const getHealthFactor = useCallback(() => {
    if (!accountData) return;

    const { collateral, debt } = getHealthFactorData(accountData);

    if (!collateral.isZero() || !debt.isZero()) {
      setHealthFactor({ collateral, debt });
    } else {
      setHealthFactor(undefined);
    }
  }, [accountData]);

  useEffect(() => {
    if (!walletAddress) return;
    getHealthFactor();
  }, [walletAddress, accountData, getHealthFactor]);

  useEffect(() => void analytics.page(), []);

  return (
    <>
      <OperationsModal />
      <MobileNavbar />
      <Grid container sx={{ maxWidth, margin: 'auto' }}>
        <DashboardHeader healthFactor={healthFactor} />
      </Grid>
      <DashboardContent healthFactor={healthFactor} />
    </>
  );
};

export default DashBoard;
