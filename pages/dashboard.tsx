import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { Option } from 'react-dropdown';

import Navbar from 'components/Navbar';
import Footer from 'components/Footer';
import MobileNavbar from 'components/MobileNavbar';
import CurrentNetwork from 'components/CurrentNetwork';
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
import FaucetModal from 'components/FaucetModal';
import FloatingBorrowModal from 'components/FloatingBorrowModal';
import FloatingRepayModal from 'components/FloatingRepayModal';

import { AuditorProvider } from 'contexts/AuditorContext';
import { FixedLenderProvider } from 'contexts/FixedLenderContext';
import { useWeb3Context } from 'contexts/Web3Context';
import { PreviewerProvider } from 'contexts/PreviewerContext';
import { AccountDataProvider } from 'contexts/AccountDataContext';

import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';
import { AccountData } from 'types/AccountData';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';

import useModal from 'hooks/useModal';

import translations from 'dictionary/en.json';

import { getContractData } from 'utils/contracts';

import getABI from 'config/abiImporter';

interface Props {}

const DashBoard: NextPage<Props> = () => {
  const { walletAddress, network } = useWeb3Context();

  const { modal, handleModal, modalContent } = useModal();

  const [accountData, setAccountData] = useState<AccountData>();
  const [minimized, setMinimized] = useState<boolean>(false);

  const { Previewer, Auditor, FixedLenders } = getABI(network?.name);

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
    if ((!modal || modalContent == {}) && Previewer) {
      setTimeout(() => {
        if (!walletAddress) return;
        getAccountData();
      }, 5000);
    }
  }, [modal, modalContent]);

  useEffect(() => {
    if (!walletAddress) return;
    getAccountData();
  }, [walletAddress]);

  async function getAccountData() {
    try {
      const previewerContract = getContractData(network?.name, Previewer.address!, Previewer.abi!);
      const data = await previewerContract?.exactly(walletAddress);
      const newAccountData: AccountData = {};

      data.forEach((fixedLender: FixedLenderAccountData) => {
        newAccountData[fixedLender.assetSymbol] = fixedLender;
      });

      setAccountData(newAccountData);
    } catch (e) {
      console.log(e);
    }
  }

  function showModal(data: Deposit | Borrow, type: String) {
    if (modalContent?.type) {
      return setMinimized((minimized) => !minimized);
    }

    handleModal({ content: { ...data, type } });
  }

  return (
    <>
      {Auditor && (
        <PreviewerProvider value={Previewer}>
          <AccountDataProvider value={{ accountData, setAccountData }}>
            <AuditorProvider value={Auditor}>
              <FixedLenderProvider value={FixedLenders}>
                {modal && modalContent?.type == 'faucet' && (
                  <FaucetModal closeModal={handleModal} />
                )}

                {modal && modalContent?.type == 'floatingBorrow' && (
                  <FloatingBorrowModal data={modalContent} closeModal={handleModal} />
                )}

                {modal && modalContent?.type == 'floatingRepay' && (
                  <FloatingRepayModal data={modalContent} closeModal={handleModal} />
                )}

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
                <CurrentNetwork showModal={showModal} />
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
                    <SmartPoolDashboard showModal={showModal} tab={tab} />
                    <MaturityPoolDashboard showModal={showModal} tab={tab} />
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
