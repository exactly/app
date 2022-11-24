import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import Grid from '@mui/material/Grid';
import DashboardHeader from 'components/dashboard/DashboardHeader';
import MobileNavbar from 'components/MobileNavbar';
import Navbar from 'components/Navbar';
import OperationsModals from 'components/OperationsModal';
import AccountDataContext from 'contexts/AccountDataContext';
import { useWeb3Context } from 'contexts/Web3Context';
import { globals } from 'styles/theme';
import getHealthFactorData from 'utils/getHealthFactorData';
import { HealthFactor } from 'types/HealthFactor';
import analytics from 'utils/analytics';

const { maxWidth } = globals;
void analytics.page();

const DashboardContent = dynamic(() => import('components/dashboard/DashboardContent'));
const DashBoard: NextPage = () => {
  const { walletAddress } = useWeb3Context();
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

  return (
    <>
      <OperationsModals />
      <MobileNavbar />
      <Navbar />
      <Grid container sx={{ maxWidth, margin: 'auto', marginTop: '130px' }}>
        <DashboardHeader healthFactor={healthFactor} />
      </Grid>
      <DashboardContent healthFactor={healthFactor} />
    </>
  );
};

export default DashBoard;
