import { useState } from 'react';
import type { NextPage } from 'next';

import Navbar from 'components/Navbar';
import Footer from 'components/Footer';
import MobileNavbar from 'components/MobileNavbar';
import CurrentNetwork from 'components/CurrentNetwork';
import MaturityPoolDashboard from 'components/MaturityPoolDashboard';
import SmartPoolDashboard from 'components/SmartPoolDashboard';
import DashboardHeader from 'components/DashboardHeader';
import Tabs from 'components/Tabs';
import EmptyState from 'components/EmptyState';
import ModalsContainer from 'components/ModalsContainer';

import { useWeb3Context } from 'contexts/Web3Context';

import { Option } from 'react-dropdown';

import translations from 'dictionary/en.json';

interface Props {}

const DashBoard: NextPage<Props> = () => {
  const { walletAddress } = useWeb3Context();

  const tabDeposit = {
    label: translations.deposit,
    value: 'deposit'
  };

  const tabBorrow = {
    label: translations.borrow,
    value: 'borrow'
  };

  const [tab, setTab] = useState<Option>(tabDeposit);

  return (
    <>
      <ModalsContainer />
      <MobileNavbar />
      <Navbar />
      <CurrentNetwork />
      <DashboardHeader />
      <Tabs
        values={[tabDeposit, tabBorrow]}
        selected={tab}
        handleTab={(value: Option) => {
          setTab(value);
        }}
      />
      {walletAddress ? (
        <>
          <SmartPoolDashboard tab={tab} />
          <MaturityPoolDashboard tab={tab} />
        </>
      ) : (
        <EmptyState />
      )}
      <Footer />
    </>
  );
};

export default DashBoard;
