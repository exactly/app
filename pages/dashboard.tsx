import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { request } from 'graphql-request';

import Navbar from 'components/Navbar';
import Footer from 'components/Footer';
import MobileNavbar from 'components/MobileNavbar';
import MaturityPoolDashboard from 'components/MaturityPoolDashboard';
import SmartPoolDashboard from 'components/SmartPoolDashboard';

import { AuditorProvider } from 'contexts/AuditorContext';
import { FixedLenderProvider } from 'contexts/FixedLenderContext';
import { InterestRateModelProvider } from 'contexts/InterestRateModelContext';

import { Contract } from 'types/Contract';
import { Dictionary } from 'types/Dictionary';
import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';

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

  const [maturityPoolDeposits, setMaturityPoolDeposits] = useState<Array<Deposit>>([]);
  const [maturityPoolBorrows, setMaturityPoolBorrows] = useState<Array<Borrow>>([]);
  const [smartPoolDeposits, setSmartPoolDeposits] = useState<Dictionary<number>>();

  const fixedLenders = [FixedLenderDAI, FixedLenderWETH];

  useEffect(() => {
    getData();
  }, [address]);

  async function getData() {
    if (!address) return;

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

  function formatSmartPoolDeposits(rawDeposits: Deposit[]) {
    let depositsDict: Dictionary<number> = {};

    rawDeposits.forEach((deposit) => {
      const oldAmount = depositsDict[deposit.symbol] ?? 0;
      depositsDict[deposit.symbol] = oldAmount + parseInt(deposit.amount);
    });

    return depositsDict;
  }

  return (
    <AuditorProvider value={Auditor}>
      <FixedLenderProvider value={fixedLenders}>
        <InterestRateModelProvider value={InterestRateModel}>
          <MobileNavbar />
          <Navbar />
          <MaturityPoolDashboard deposits={maturityPoolDeposits} borrows={maturityPoolBorrows} />
          <SmartPoolDashboard deposits={smartPoolDeposits} />
          <Footer />
        </InterestRateModelProvider>
      </FixedLenderProvider>
    </AuditorProvider>
  );
};

export default DashBoard;
