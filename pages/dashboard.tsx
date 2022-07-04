import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
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
import { AccountDataProvider } from 'contexts/AccountDataContext';

import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';
import { AccountData } from 'types/AccountData';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';
import { Dictionary } from 'types/Dictionary';

import useModal from 'hooks/useModal';

import translations from 'dictionary/en.json';

import { getContractData } from 'utils/contracts';

import getABI from 'config/abiImporter';

interface Props {}

const DashBoard: NextPage<Props> = () => {
  const { walletAddress, network } = useWeb3Context();

  const { modal, handleModal, modalContent } = useModal();

  const [accountData, setAccountData] = useState<AccountData>();

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
    if (!walletAddress) return;
    getAccountData();
  }, [walletAddress]);

  async function getAccountData() {
    try {
      const previewerContract = getContractData(network?.name, Previewer.address!, Previewer.abi!);
      const data = await previewerContract?.accounts(walletAddress);
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
      //in the future we should handle the minimized modal status through a context here
      return;
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
