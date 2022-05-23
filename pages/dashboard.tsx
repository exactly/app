import { useState, useEffect, useContext } from 'react';
import type { NextPage } from 'next';
import { request } from 'graphql-request';
import { Option } from 'react-dropdown';

import Navbar from 'components/Navbar';
import Footer from 'components/Footer';
import MobileNavbar from 'components/MobileNavbar';
import MaturityPoolDashboard from 'components/MaturityPoolDashboard';
import SmartPoolDashboard from 'components/SmartPoolDashboard';
import RepayModal from 'components/RepayModal';
import WithdrawModalMP from 'components/WithdrawModalMP';
import WithdrawModalSP from 'components/WithdrawModalSP';
import DepositModalMP from 'components/DepositModalMP';
import DepositModalSP from 'components/DepositModalSP';
import BorrowModal from 'components/BorrowModal';
import DashboardHeader from 'components/DashboardHeader';
import Tabs from 'components/Tabs';
import EmptyState from 'components/EmptyState';

import { AuditorProvider } from 'contexts/AuditorContext';
import { FixedLenderProvider } from 'contexts/FixedLenderContext';
import { useWeb3Context } from 'contexts/Web3Context';
import PreviewerContext from 'contexts/PreviewerContext';
import { AccountDataContext } from 'contexts/AccountDataContext';

import { Contract } from 'types/Contract';
import { Dictionary } from 'types/Dictionary';
import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';

import useModal from 'hooks/useModal';

import {
  getMaturityPoolBorrowsQuery,
  getMaturityPoolDepositsQuery,
  getSmartPoolDepositsQuery,
  getSmartPoolWithdrawsQuery
} from 'queries';

//Contracts
import Auditor from 'protocol/deployments/kovan/Auditor.json';
import FixedLenderDAI from 'protocol/deployments/kovan/FixedLenderDAI.json';
import FixedLenderWETH from 'protocol/deployments/kovan/FixedLenderWETH.json';

import translations from 'dictionary/en.json';

import getSubgraph from 'utils/getSubgraph';
import { getContractData } from 'utils/contracts';

interface Props {
  auditor: Contract;
  assetsAddresses: Dictionary<string>;
  fixedLender: Contract;
}

const DashBoard: NextPage<Props> = () => {
  const { walletAddress } = useWeb3Context();
  const previewerData = useContext(PreviewerContext);
  const { accountData, setAccountData } = useContext(AccountDataContext);
  const { modal, handleModal, modalContent } = useModal();

  const [maturityPoolDeposits, setMaturityPoolDeposits] = useState<Array<Deposit>>([]);
  // const [getMaturityPoolWithdraws, setMaturityPoolWithdraws] = useState<Array<WithdrawMP>>([]);
  const [maturityPoolBorrows, setMaturityPoolBorrows] = useState<Array<Borrow>>([]);
  // const [maturityPoolRepays, setMaturityPoolRepays] = useState<Array<Repay>>([]);

  const fixedLenders = [FixedLenderDAI, FixedLenderWETH];
  const previewerContract = getContractData(previewerData.address!, previewerData.abi!);

  const tabDeposit = {
    label: translations.deposit,
    value: 'deposit'
  };

  const tabBorrow = {
    label: translations.borrow,
    value: 'borrow'
  };

  const [tab, setTab] = useState<Option>(tabDeposit);

  useEffect(() => {
    if (!walletAddress) return;
    getData();
    getAccountData();
  }, [walletAddress]);

  async function getAccountData() {
    try {
      const data = await previewerContract?.extendedAccountData(walletAddress);
      setAccountData(data);
    } catch (e) {
      console.log(e);
    }
  }

  async function getData() {
    if (!walletAddress) return;
    try {
      const subgraphUrl = getSubgraph();

      //MP
      const getMaturityPoolDeposits = await request(
        subgraphUrl,
        getMaturityPoolDepositsQuery(walletAddress)
      );

      // const getMaturityPoolWithdraws = await request(
      //   subgraphUrl,
      //   getMaturityPoolWithdrawsQuery(walletAddress)
      // );

      const getMaturityPoolBorrows = await request(
        subgraphUrl,
        getMaturityPoolBorrowsQuery(walletAddress)
      );

      // const getMaturityPoolRepays = await request(
      //  subgraphUrl,
      //   getMaturityPoolRepaysQuery(walletAddress)
      // );

      //SP
      const getSmartPoolDeposits = await request(
        subgraphUrl,
        getSmartPoolDepositsQuery(walletAddress)
      );

      const getSmartPoolWithdraws = await request(
        subgraphUrl,
        getSmartPoolWithdrawsQuery(walletAddress)
      );

      // const smartPoolDeposits = formatSmartPoolDeposits(
      //   getSmartPoolDeposits.deposits,
      //   getSmartPoolWithdraws.withdraws
      // );

      setMaturityPoolDeposits(getMaturityPoolDeposits.depositAtMaturities);
      setMaturityPoolBorrows(getMaturityPoolBorrows.borrowAtMaturities);
    } catch (e) {
      console.log(e);
    }
  }

  function showModal(data: Deposit | Borrow, type: String) {
    if (modalContent?.type) {
      //in the future we should handle the minimized modal status through a context here
      return;
    }

    handleModal({ content: { ...data, type } });
  }

  return (
    <AuditorProvider value={Auditor}>
      <FixedLenderProvider value={fixedLenders}>
        {modal && modalContent?.type == 'borrow' && (
          <BorrowModal data={modalContent} closeModal={handleModal} editable />
        )}

        {modal && modalContent?.type == 'repay' && (
          <RepayModal data={modalContent} closeModal={handleModal} />
        )}

        {modal && modalContent?.type == 'deposit' && (
          <DepositModalMP data={modalContent} closeModal={handleModal} editable />
        )}

        {modal && modalContent?.type == 'withdraw' && (
          <WithdrawModalMP data={modalContent} closeModal={handleModal} />
        )}

        {modal && modalContent?.type == 'smartDeposit' && (
          <DepositModalSP data={modalContent} closeModal={handleModal} />
        )}

        {modal && modalContent?.type == 'withdrawSP' && (
          <WithdrawModalSP data={modalContent} closeModal={handleModal} />
        )}

        <MobileNavbar />
        <Navbar />
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
            {tab.value == 'deposit' && <SmartPoolDashboard showModal={showModal} />}
            <MaturityPoolDashboard
              deposits={maturityPoolDeposits}
              borrows={maturityPoolBorrows}
              showModal={showModal}
              tab={tab}
            />
          </>
        ) : (
          <EmptyState />
        )}
        <Footer />
      </FixedLenderProvider>
    </AuditorProvider>
  );
};

export default DashBoard;
