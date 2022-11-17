import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React, { useContext, useEffect, useState } from 'react';

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

const { maxWidth } = globals;

const DashboardContent = dynamic(() => import('components/dashboard/DashboardContent'));
const DashBoard: NextPage = () => {
  const { walletAddress } = useWeb3Context();
  const { accountData } = useContext(AccountDataContext);

  const [healthFactor, setHealthFactor] = useState<HealthFactor | undefined>(undefined);

  useEffect(() => {
    if (!walletAddress) return;
    getHealthFactor();
  }, [walletAddress, accountData]);

  function getHealthFactor() {
    if (!accountData) return;

    const { collateral, debt } = getHealthFactorData(accountData);

    if (!collateral.isZero() || !debt.isZero()) {
      setHealthFactor({ collateral, debt });
    } else {
      setHealthFactor(undefined);
    }
  }

  return (
    <>
      <OperationsModals />
      <MobileNavbar />
      <Navbar />
      <Grid container sx={{ maxWidth: maxWidth, margin: 'auto', marginTop: '130px' }}>
        <DashboardHeader healthFactor={healthFactor} />
      </Grid>
      <DashboardContent healthFactor={healthFactor} />
    </>
  );
};

export default DashBoard;
