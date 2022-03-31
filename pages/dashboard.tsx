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

import { AuditorProvider } from 'contexts/AuditorContext';
import { FixedLenderProvider } from 'contexts/FixedLenderContext';
import { InterestRateModelProvider } from 'contexts/InterestRateModelContext';

import { Contract } from 'types/Contract';
import { Dictionary } from 'types/Dictionary';
import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';

import { getCurrentWalletConnected } from 'hooks/useWallet';
import useModal from 'hooks/useModal';

import {
  getMaturityPoolBorrowsQuery,
  getMaturityPoolDepositsQuery,
  getSmartPoolDepositsQuery
} from 'queries';

//Contracts
import InterestRateModel from 'protocol/deployments/kovan/InterestRateModel.json';
import Auditor from 'protocol/deployments/kovan/Auditor.json';
import FixedLenderDAI from 'protocol/deployments/kovan/FixedLenderDAI.json';
import FixedLenderWETH from 'protocol/deployments/kovan/FixedLenderWETH.json';

interface Props {
  walletAddress: string;
  network: string;
  auditor: Contract;
  assetsAddresses: Dictionary<string>;
  fixedLender: Contract;
  interestRateModel: Contract;
}

const DashBoard: NextPage<Props> = ({ walletAddress, network }) => {
  const { modal, handleModal, modalContent } = useModal();

  const [maturityPoolDeposits, setMaturityPoolDeposits] = useState<Array<Deposit>>([]);
  const [maturityPoolBorrows, setMaturityPoolBorrows] = useState<Array<Borrow>>([]);
  const [smartPoolDeposits, setSmartPoolDeposits] = useState<Dictionary<number>>();

  const fixedLenders = [FixedLenderDAI, FixedLenderWETH];

  useEffect(() => {
    getData();
  }, []);

  async function getData() {
    const { address } = await getCurrentWalletConnected();
    const getMaturityPoolDeposits = await request(
      'https://api.thegraph.com/subgraphs/name/juanigallo/exactly-kovan',
      getMaturityPoolDepositsQuery(address)
    );
    const getMaturityPoolBorrows = await request(
      'https://api.thegraph.com/subgraphs/name/juanigallo/exactly-kovan',
      getMaturityPoolBorrowsQuery(address)
    );

    const getSmartPoolDeposits = await request(
      'https://api.thegraph.com/subgraphs/name/juanigallo/exactly-kovan',
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
          {modal && modalContent?.type == 'borrow' && (
            <RepayModal
              data={modalContent}
              closeModal={handleModal}
              walletAddress={walletAddress}
            />
          )}
          {modal && modalContent?.type == 'deposit' && (
            <WithdrawModalMP
              data={modalContent}
              closeModal={handleModal}
              walletAddress={walletAddress}
            />
          )}
          {modal && modalContent?.type == 'withdrawSP' && (
            <WithdrawModalSP
              data={modalContent}
              closeModal={handleModal}
              walletAddress={walletAddress}
            />
          )}
          <MobileNavbar walletAddress={walletAddress} network={network} />
          <Navbar walletAddress={walletAddress} />
          <MaturityPoolDashboard
            deposits={maturityPoolDeposits}
            borrows={maturityPoolBorrows}
            showModal={showModal}
          />
          <SmartPoolDashboard
            deposits={smartPoolDeposits}
            walletAddress={walletAddress}
            showModal={showModal}
          />
          <Footer />
        </InterestRateModelProvider>
      </FixedLenderProvider>
    </AuditorProvider>
  );
};

export default DashBoard;
