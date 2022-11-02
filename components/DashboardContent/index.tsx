import React, { useState } from 'react';
import dynamic from 'next/dynamic';

import Tabs from 'components/Tabs';

// const DashboardUserCharts = dynamic(() => import('components/DashboardUserCharts'));
const SmartPoolDashboard = dynamic(() => import('components/SmartPoolDashboard'));
const MaturityPoolDashboard = dynamic(() => import('components/MaturityPoolDashboard'));
const EmptyState = dynamic(() => import('components/EmptyState'));

import { useWeb3Context } from 'contexts/Web3Context';

import { Option } from 'react-dropdown';

import translations from 'dictionary/en.json';

import styles from './style.module.scss';

function DashboardContent() {
  const { walletAddress } = useWeb3Context();

  const tabDeposit = {
    label: translations.deposit,
    value: 'deposit',
  };

  const tabBorrow = {
    label: translations.borrow,
    value: 'borrow',
  };

  const [tab, setTab] = useState<Option>(tabDeposit);

  return (
    <section className={styles.container}>
      {/* <div className={styles.chartContainer}>{<DashboardUserCharts />}</div> */}
      <div className={styles.poolsContainer}>
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
      </div>
    </section>
  );
}

export default DashboardContent;
