import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import { request } from 'graphql-request'

import { ethers } from 'ethers';
import axios from 'axios';

import Navbar from 'components/Navbar';
import Footer from 'components/Footer';
import MobileNavbar from 'components/MobileNavbar';
import MaturityPoolDashboard from 'components/MaturityPoolDashboard';

import { AuditorProvider } from 'contexts/AuditorContext';
import { FixedLenderProvider } from 'contexts/FixedLenderContext';
import { InterestRateModelProvider } from 'contexts/InterestRateModelContext';

import { Contract } from 'types/Contract';
import { Dictionary } from 'types/Dictionary';
import { Borrow } from 'types/Borrow';
import { Deposit } from 'types/Deposit';

import { getCurrentWalletConnected } from 'hooks/useWallet';

import { getMaturityPoolBorrowsQuery, getMaturityPoolDepositsQuery } from 'queries';

import dictionary from 'dictionary/en.json';
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
  const [maturityPoolDeposits, setMaturityPoolDeposits] = useState<Array<Deposit>>([]);
  const [maturityPoolBorrows, setMaturityPoolBorrows] = useState<Array<Borrow>>([]);

  useEffect(() => {
    getData();
  }, [])

  async function getData() {
    const { address } = await getCurrentWalletConnected();
    const getMaturityPoolDeposits = await request('https://api.thegraph.com/subgraphs/name/juanigallo/exactly-kovan', getMaturityPoolDepositsQuery(address))
    const getMaturityPoolBorrows = await request('https://api.thegraph.com/subgraphs/name/juanigallo/exactly-kovan', getMaturityPoolBorrowsQuery(address))

    setMaturityPoolDeposits(getMaturityPoolDeposits.deposits)
    setMaturityPoolBorrows(getMaturityPoolBorrows.borrows)
  }

  return (
    <AuditorProvider value={auditor}>
      <FixedLenderProvider
        value={{ addresses: assetsAddresses, abi: fixedLender.abi }}
      >
        <InterestRateModelProvider value={interestRateModel}>
          <MobileNavbar walletAddress={walletAddress} network={network} />
          <Navbar walletAddress={walletAddress} />
          <MaturityPoolDashboard deposits={maturityPoolDeposits} borrows={maturityPoolBorrows} />
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
