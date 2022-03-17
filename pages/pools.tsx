import { useState, useEffect } from 'react';
import type { NextPage } from 'next';

import { ethers } from 'ethers';
import axios from 'axios';

import MarketsList from 'components/MarketsList';
import MaturitySelector from 'components/MaturitySelector';
import Modal from 'components/Modal';
import Navbar from 'components/Navbar';
import CurrentNetwork from 'components/CurrentNetwork';
import Footer from 'components/Footer';
import MobileNavbar from 'components/MobileNavbar';
import SmartPoolList from 'components/SmartPoolList';
import SmartPoolModal from 'components/SmartPoolModal';

import useContract from 'hooks/useContract';
import useModal from 'hooks/useModal';

import { AuditorProvider } from 'contexts/AuditorContext';
import { FixedLenderProvider } from 'contexts/FixedLenderContext';
import { InterestRateModelProvider } from 'contexts/InterestRateModelContext';

import { Market } from 'types/Market';
import { UnformattedMarket } from 'types/UnformattedMarket';
import { Contract } from 'types/Contract';
import { Dictionary } from 'types/Dictionary';

import dictionary from 'dictionary/en.json';
import { PoolAccountingProvider } from 'contexts/PoolAccountingContext';
import { UtilsProvider } from 'contexts/UtilsContext';


//Contracts
import InterestRateModel from 'protocol/deployments/kovan/InterestRateModel.json'
import Auditor from 'protocol/deployments/kovan/Auditor.json'
import Utils from 'protocol/deployments/kovan/TSUtils.json'

interface Props {
  walletAddress: string;
  network: string;
  assetsAddresses: Dictionary<string>;
  fixedLender: Contract;
  poolAccounting: Contract;
}

const Pools: NextPage<Props> = ({
  walletAddress,
  network,
  assetsAddresses,
  fixedLender,
  poolAccounting,
}) => {
  const { modal, handleModal, modalContent } = useModal();

  const [markets, setMarkets] = useState<Array<Market>>([]);
  const { contract } = useContract(Auditor?.address, Auditor?.abi);

  useEffect(() => {
    if (contract) {
      getMarkets();
    }
  }, [contract]);

  async function getMarkets() {
    const marketsAddresses = await contract?.getMarketAddresses();
    const marketsData: Array<UnformattedMarket> = [];

    marketsAddresses.map((address: string) => {
      marketsData.push(contract?.getMarketData(address));
    });

    Promise.all(marketsData).then((data: Array<UnformattedMarket>) => {
      setMarkets(formatMarkets(data));
    });
  }

  function formatMarkets(markets: Array<UnformattedMarket>) {
    const length = markets.length;

    let formattedMarkets: Array<Market> = [];

    for (let i = 0; i < length; i++) {
      const market: Market = {
        address: '',
        symbol: '',
        name: '',
        isListed: false,
        collateralFactor: 0
      };

      market['address'] = markets[i][5];
      market['symbol'] = markets[i][0];
      market['name'] = markets[i][1];
      market['isListed'] = markets[i][2];
      market['collateralFactor'] = parseFloat(ethers.utils.formatEther(markets[i][3]));

      formattedMarkets = [...formattedMarkets, market];
    }

    return formattedMarkets;
  }

  function showModal(address: Market['address'], type: String) {
    if (modalContent?.type) {
      //in the future we should handle the minimized modal status through a context here
      return;
    }

    const data = markets.find((market) => {
      return market.address === address;
    });

    handleModal({ content: { ...data, type } });
  }

  return (
    <UtilsProvider value={Utils}>
      <AuditorProvider value={Auditor}>
        <FixedLenderProvider value={{ addresses: assetsAddresses, abi: fixedLender.abi }}>
          <PoolAccountingProvider value={poolAccounting}>
            <InterestRateModelProvider value={InterestRateModel}>
              {modal && modalContent?.type != 'smartDeposit' && (
                <Modal
                  contractData={modalContent}
                  closeModal={handleModal}
                  walletAddress={walletAddress}
                />
              )}
              {modal && modalContent?.type == 'smartDeposit' && (
                <SmartPoolModal
                  contractData={modalContent}
                  closeModal={handleModal}
                  walletAddress={walletAddress}
                />
              )}
              <MobileNavbar walletAddress={walletAddress} network={network} />
              <Navbar walletAddress={walletAddress} />
              <CurrentNetwork network={network} />
              <div style={{ marginTop: '180px' }}>
                <MaturitySelector title={dictionary.maturityPools} />
              </div>
              <MarketsList markets={markets} showModal={showModal} />
              <SmartPoolList markets={markets} showModal={showModal} />
              <Footer />
            </InterestRateModelProvider>
          </PoolAccountingProvider>
        </FixedLenderProvider>
      </AuditorProvider>
    </UtilsProvider>
  );
};

export async function getStaticProps() {

  const getFixedLenderAbi = await axios.get(
    'https://abi-versions2.s3.amazonaws.com/latest/contracts/FixedLender.sol/FixedLender.json'
  );

  const getPoolAccountingAbi = await axios.get(
    'https://abi-versions2.s3.amazonaws.com/latest/contracts/PoolAccounting.sol/PoolAccounting.json'
  );


  const addresses = await axios.get('https://abi-versions2.s3.amazonaws.com/latest/addresses.json');

  return {
    props: {
      assetsAddresses: addresses.data,
      fixedLender: {
        abi: getFixedLenderAbi.data
      },
      poolAccounting: {
        abi: getPoolAccountingAbi.data
      },
    }
  };
}

export default Pools;
