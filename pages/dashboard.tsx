import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { request } from 'graphql-request';

import axios from 'axios';

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

import { getCurrentWalletConnected } from 'hooks/useWallet';

import {
  getMaturityPoolBorrowsQuery,
  getMaturityPoolDepositsQuery,
  getSmartPoolDepositsQuery
} from 'queries';

interface Props {
  walletAddress: string;
  network: string;
  auditor: Contract;
  assetsAddresses: Dictionary<string>;
  fixedLender: Contract;
  interestRateModel: Contract;
}

const DashBoard: NextPage<Props> = ({
  walletAddress,
  network,
  auditor,
  assetsAddresses,
  fixedLender,
  interestRateModel
}) => {
  const [maturityPoolDeposits, setMaturityPoolDeposits] = useState<
    Array<Deposit>
  >([]);
  const [maturityPoolBorrows, setMaturityPoolBorrows] = useState<Array<Borrow>>(
    []
  );
  const [smartPoolDeposits, setSmartPoolDeposits] = useState<Dictionary<number>>()

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

    const smartPoolDeposits = formatSmartPoolDeposits(getSmartPoolDeposits.deposits)
    // console.log(getSmartPoolDeposits.deposits)
    setMaturityPoolDeposits(getMaturityPoolDeposits.deposits);
    setMaturityPoolBorrows(getMaturityPoolBorrows.borrows);
    setSmartPoolDeposits(smartPoolDeposits)
  }

  function formatSmartPoolDeposits(rawDeposits: Deposit[]) {
    let depositsDict: Dictionary<number> = {}


    rawDeposits.forEach((deposit) => {
      const oldAmount = depositsDict[deposit.symbol] ?? 0;
      depositsDict[deposit.symbol] = oldAmount + parseInt(deposit.amount)
    })

    return depositsDict
  }

  return (
    <AuditorProvider value={auditor}>
      <FixedLenderProvider
        value={{ addresses: assetsAddresses, abi: fixedLender.abi }}
      >
        <InterestRateModelProvider value={interestRateModel}>
          <MobileNavbar walletAddress={walletAddress} network={network} />
          <Navbar walletAddress={walletAddress} />
          <MaturityPoolDashboard
            deposits={maturityPoolDeposits}
            borrows={maturityPoolBorrows}
          />
          <SmartPoolDashboard deposits={smartPoolDeposits} walletAddress={walletAddress} />
          <Footer />
        </InterestRateModelProvider>
      </FixedLenderProvider>
    </AuditorProvider>
  );
};

export async function getStaticProps() {
  const getAuditorAbi = await axios.get(
    'https://abi-versions2.s3.amazonaws.com/latest/contracts/Auditor.sol/Auditor.json'
  );
  const getFixedLenderAbi = await axios.get(
    'https://abi-versions2.s3.amazonaws.com/latest/contracts/FixedLender.sol/FixedLender.json'
  );
  const getInterestRateModelAbi = await axios.get(
    'https://abi-versions2.s3.amazonaws.com/latest/contracts/InterestRateModel.sol/InterestRateModel.json'
  );
  const addresses = await axios.get(
    'https://abi-versions2.s3.amazonaws.com/latest/addresses.json'
  );
  const auditorAddress = addresses?.data?.auditor;
  const interestRateModelAddress = addresses?.data?.interestRateModel;

  return {
    props: {
      auditor: {
        abi: getAuditorAbi.data,
        address: auditorAddress
      },
      interestRateModel: {
        abi: getInterestRateModelAbi.data,
        address: interestRateModelAddress
      },
      assetsAddresses: addresses.data,
      fixedLender: {
        abi: getFixedLenderAbi.data
      }
    }
  };
}

export default DashBoard;
