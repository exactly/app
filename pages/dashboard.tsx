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
import { PreviewerProvider } from 'contexts/PreviewerContext';

import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';

import useModal from 'hooks/useModal';

import { getAllMaturityPoolBorrowsQuery, getAllMaturityPoolDepositsQuery } from 'queries';

import translations from 'dictionary/en.json';

import getSubgraph from 'utils/getSubgraph';

import getABI from 'config/abiImporter';
import { AccountDataProvider } from 'contexts/AccountDataContext';

interface Props {}

const DashBoard: NextPage<Props> = () => {
  const { walletAddress, network } = useWeb3Context();

  const { modal, handleModal, modalContent } = useModal();

  const [maturityPoolDeposits, setMaturityPoolDeposits] = useState<Array<Deposit>>([]);
  const [maturityPoolBorrows, setMaturityPoolBorrows] = useState<Array<Borrow>>([]);

  const { Previewer, Auditor, FixedLenderDAI, FixedLenderWETH } = getABI(network?.name);

  const fixedLenders = [FixedLenderDAI, FixedLenderWETH];

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
  }, [walletAddress]);

  async function getData() {
    if (!walletAddress) return;
    try {
      const subgraphUrl = getSubgraph(network?.name);

      //MP
      const getMaturityPoolDeposits = await request(
        subgraphUrl,
        getAllMaturityPoolDepositsQuery(walletAddress)
      );

      const getMaturityPoolBorrows = await request(
        subgraphUrl,
        getAllMaturityPoolBorrowsQuery(walletAddress)
      );

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
    <>
      {Auditor && (
        <PreviewerProvider value={Previewer}>
          <AccountDataProvider>
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
          </AccountDataProvider>
        </PreviewerProvider>
      )}
    </>
  );
};

export default DashBoard;
