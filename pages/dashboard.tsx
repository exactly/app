import { useState, useEffect } from 'react';
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
import { InterestRateModelProvider } from 'contexts/InterestRateModelContext';
import { useWeb3Context } from 'contexts/Web3Context';
import { PreviewerProvider } from 'contexts/PreviewerContext';

import { Contract } from 'types/Contract';
import { Dictionary } from 'types/Dictionary';
import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';
import { Withdraw } from 'types/Withdraw';
// import { Repay } from 'types/Repay';
// import { WithdrawMP } from 'types/WithdrawMP';

import useModal from 'hooks/useModal';

import {
  getMaturityPoolBorrowsQuery,
  getMaturityPoolDepositsQuery,
  // getMaturityPoolRepaysQuery,
  // getMaturityPoolWithdrawsQuery,
  getSmartPoolDepositsQuery,
  getSmartPoolWithdrawsQuery
} from 'queries';

//Contracts
import InterestRateModel from 'protocol/deployments/kovan/InterestRateModel.json';
import Auditor from 'protocol/deployments/kovan/Auditor.json';
import FixedLenderDAI from 'protocol/deployments/kovan/FixedLenderDAI.json';
import FixedLenderWETH from 'protocol/deployments/kovan/FixedLenderWETH.json';
import Previewer from 'protocol/deployments/kovan/Previewer.json';

import translations from 'dictionary/en.json';

import { getSymbol } from 'utils/utils';

interface Props {
  auditor: Contract;
  assetsAddresses: Dictionary<string>;
  fixedLender: Contract;
  interestRateModel: Contract;
}

const DashBoard: NextPage<Props> = () => {
  const { walletAddress } = useWeb3Context();
  const { modal, handleModal, modalContent } = useModal();

  const [maturityPoolDeposits, setMaturityPoolDeposits] = useState<Array<Deposit>>([]);
  // const [getMaturityPoolWithdraws, setMaturityPoolWithdraws] = useState<Array<WithdrawMP>>([]);
  const [maturityPoolBorrows, setMaturityPoolBorrows] = useState<Array<Borrow>>([]);
  // const [maturityPoolRepays, setMaturityPoolRepays] = useState<Array<Repay>>([]);
  const [smartPoolDeposits, setSmartPoolDeposits] = useState<Dictionary<Deposit>>();
  // const [smartPoolWithdraws, setSmartPoolWithdraws] = useState<Dictionary<Withdraw>>();

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
    getData();
  }, [walletAddress]);

  async function getData() {
    if (!walletAddress) return;

    //MP

    const getMaturityPoolDeposits = await request(
      'https://api.thegraph.com/subgraphs/name/exactly-finance/exactly',
      getMaturityPoolDepositsQuery(walletAddress)
    );

    // const getMaturityPoolWithdraws = await request(
    //   'https://api.thegraph.com/subgraphs/name/exactly-finance/exactly',
    //   getMaturityPoolWithdrawsQuery(walletAddress)
    // );

    const getMaturityPoolBorrows = await request(
      'https://api.thegraph.com/subgraphs/name/exactly-finance/exactly',
      getMaturityPoolBorrowsQuery(walletAddress)
    );

    // const getMaturityPoolRepays = await request(
    //   'https://api.thegraph.com/subgraphs/name/exactly-finance/exactly',
    //   getMaturityPoolRepaysQuery(walletAddress)
    // );

    //SP
    const getSmartPoolDeposits = await request(
      'https://api.thegraph.com/subgraphs/name/exactly-finance/exactly',
      getSmartPoolDepositsQuery(walletAddress)
    );

    const getSmartPoolWithdraws = await request(
      'https://api.thegraph.com/subgraphs/name/exactly-finance/exactly',
      getSmartPoolWithdrawsQuery(walletAddress)
    );

    const smartPoolDeposits = formatSmartPoolDeposits(
      getSmartPoolDeposits.deposits,
      getSmartPoolWithdraws.withdraws
    );

    setSmartPoolDeposits(smartPoolDeposits);

    setMaturityPoolDeposits(getMaturityPoolDeposits.depositAtMaturities);
    setMaturityPoolBorrows(getMaturityPoolBorrows.borrowAtMaturities);
  }

  function showModal(data: Deposit | Borrow, type: String) {
    if (modalContent?.type) {
      //in the future we should handle the minimized modal status through a context here
      return;
    }

    handleModal({ content: { ...data, type } });
  }

  function formatSmartPoolDeposits(rawDeposits: Deposit[], rawWithdraws: Withdraw[]) {
    let depositsDict: Dictionary<any> = {};

    rawDeposits.forEach((deposit) => {
      const symbol = getSymbol(deposit.market);

      const oldAmount = depositsDict[symbol]?.assets ?? 0;
      const newAmount = oldAmount + parseInt(deposit.assets);
      depositsDict[symbol] = { ...deposit, assets: newAmount };
    });

    rawWithdraws.forEach((withdraw) => {
      const symbol = getSymbol(withdraw.market);

      const oldAmount = depositsDict[symbol]?.assets;
      const newAmount = oldAmount - parseInt(withdraw.assets);
      depositsDict[symbol] = { ...withdraw, assets: newAmount };
    });

    return depositsDict;
  }

  return (
    <PreviewerProvider value={Previewer}>
      <AuditorProvider value={Auditor}>
        <FixedLenderProvider value={fixedLenders}>
          <InterestRateModelProvider value={InterestRateModel}>
            {modal && modalContent?.type == 'borrow' && (
              <BorrowModal data={modalContent} closeModal={handleModal} />
            )}

            {modal && modalContent?.type == 'repay' && (
              <RepayModal data={modalContent} closeModal={handleModal} />
            )}

            {modal && modalContent?.type == 'deposit' && (
              <DepositModalMP data={modalContent} closeModal={handleModal} />
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
                {tab.value == 'deposit' && (
                  <SmartPoolDashboard deposits={smartPoolDeposits} showModal={showModal} />
                )}
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
          </InterestRateModelProvider>
        </FixedLenderProvider>
      </AuditorProvider>
    </PreviewerProvider>
  );
};

export default DashBoard;
