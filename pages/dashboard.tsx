import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { request } from 'graphql-request';

import Navbar from 'components/Navbar';
import Footer from 'components/Footer';
import MobileNavbar from 'components/MobileNavbar';
import MaturityPoolDashboard from 'components/MaturityPoolDashboard';
import SmartPoolDashboard from 'components/SmartPoolDashboard';
import RepayModal from 'components/RepayModal';
import WithdrawModalMP from 'components/WithdrawModalMP';
import WithdrawModalSP from 'components/WithdrawModalSP';
import Modal from 'components/Modal';

import { AuditorProvider } from 'contexts/AuditorContext';
import { FixedLenderProvider } from 'contexts/FixedLenderContext';
import { InterestRateModelProvider } from 'contexts/InterestRateModelContext';

import { Contract } from 'types/Contract';
import { Dictionary } from 'types/Dictionary';
import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';

import useModal from 'hooks/useModal';

import {
  getMaturityPoolBorrowsQuery,
  getMaturityPoolDepositsQuery,
  getSmartPoolDepositsQuery
} from 'queries';

import { useWeb3Context } from 'contexts/Web3Context';
//Contracts
import InterestRateModel from 'protocol/deployments/kovan/InterestRateModel.json';
import Auditor from 'protocol/deployments/kovan/Auditor.json';
import FixedLenderDAI from 'protocol/deployments/kovan/FixedLenderDAI.json';
import FixedLenderWETH from 'protocol/deployments/kovan/FixedLenderWETH.json';

interface Props {
  auditor: Contract;
  assetsAddresses: Dictionary<string>;
  fixedLender: Contract;
  interestRateModel: Contract;
}

const DashBoard: NextPage<Props> = () => {
  const { address } = useWeb3Context();
  const { modal, handleModal, modalContent } = useModal();

  const [maturityPoolDeposits, setMaturityPoolDeposits] = useState<Array<Deposit>>([]);
  const [maturityPoolBorrows, setMaturityPoolBorrows] = useState<Array<Borrow>>([]);
  const [smartPoolDeposits, setSmartPoolDeposits] = useState<Dictionary<Deposit>>();

  const fixedLenders = [FixedLenderDAI, FixedLenderWETH];
  console.log(fixedLenders, 1234);
  useEffect(() => {
    getData();
  }, [address]);

  async function getData() {
    if (!address) return;

    const getMaturityPoolDeposits = await request(
      'https://api.thegraph.com/subgraphs/name/nicolascastrogarcia/exa-kovan',
      getMaturityPoolDepositsQuery(address)
    );
    const getMaturityPoolBorrows = await request(
      'https://api.thegraph.com/subgraphs/name/nicolascastrogarcia/exa-kovan',
      getMaturityPoolBorrowsQuery(address)
    );

    const getSmartPoolDeposits = await request(
      'https://api.thegraph.com/subgraphs/name/nicolascastrogarcia/exa-kovan',
      getSmartPoolDepositsQuery(address)
    );

    const smartPoolDeposits = formatSmartPoolDeposits(getSmartPoolDeposits.deposits);
    setMaturityPoolDeposits(getMaturityPoolDeposits.deposits);
    setMaturityPoolBorrows(getMaturityPoolBorrows.borrows);
    setSmartPoolDeposits(smartPoolDeposits);
  }

  function showModal(data: Deposit | Borrow, type: String) {
    if (modalContent?.type) {
      //in the future we should handle the minimized modal status through a context here
      return;
    }

    handleModal({ content: { ...data, type } });
    setSmartPoolDeposits(smartPoolDeposits);
  }

  function formatSmartPoolDeposits(rawDeposits: Deposit[]) {
    let depositsDict: Dictionary<any> = {};

    rawDeposits.forEach((deposit) => {
      const oldAmount = depositsDict[deposit.symbol]?.amount ?? 0;
      const newAmount = oldAmount + parseInt(deposit.amount);
      depositsDict[deposit.symbol] = { ...deposit, amount: newAmount };
    });

    return depositsDict;
  }

  return (
    <AuditorProvider value={Auditor}>
      <FixedLenderProvider value={fixedLenders}>
        <InterestRateModelProvider value={InterestRateModel}>
          {modal && modalContent?.type == 'repay' && (
            <RepayModal data={modalContent} closeModal={handleModal} />
          )}
          {modal && modalContent?.type == 'withdraw' && (
            <WithdrawModalMP data={modalContent} closeModal={handleModal} />
          )}
          {modal && modalContent?.type == 'deposit' && (
            <Modal contractData={modalContent} closeModal={handleModal} />
          )}
          {modal && modalContent?.type == 'withdrawSP' && (
            <WithdrawModalSP data={modalContent} closeModal={handleModal} />
          )}
          <MobileNavbar />
          <Navbar />
          <MaturityPoolDashboard
            deposits={maturityPoolDeposits}
            borrows={maturityPoolBorrows}
            showModal={showModal}
          />
          <SmartPoolDashboard deposits={smartPoolDeposits} showModal={showModal} />
          <Footer />
        </InterestRateModelProvider>
      </FixedLenderProvider>
    </AuditorProvider>
  );
};

export default DashBoard;
