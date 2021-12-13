import { useState, useEffect, useContext } from 'react';
import type { NextPage } from 'next';

import { ethers } from 'ethers';

import MarketsList from 'components/MarketsList';
import MaturitySelector from 'components/MaturitySelector';
import Modal from 'components/Modal';
import Navbar from 'components/Navbar';
import Hero from 'components/Hero';
import CurrentNetwork from 'components/CurrentNetwork';
import Footer from 'components/Footer';
import Overlay from 'components/Overlay';

import useContract from 'hooks/useContract';
import useModal from 'hooks/useModal';

import ContractContext from 'contexts/ContractContext';

import { Market } from 'types/Market';
import { Network } from 'types/Network';
import { UnformattedMarket } from 'types/UnformattedMarket';

interface Props {
  walletAddress: string;
  network: Network;
}

const Home: NextPage<Props> = ({ walletAddress, network }) => {
  const { modal, handleModal, modalContent } = useModal();
  const contracts = useContext(ContractContext);

  const [markets, setMarkets] = useState<Array<Market>>([]);
  const { contract } = useContract(
    contracts.auditor?.address,
    contracts.auditor?.abi
  );

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
      market['collateralFactor'] = parseFloat(
        ethers.utils.formatEther(markets[i][3])
      );

      formattedMarkets = [...formattedMarkets, market];
    }

    return formattedMarkets;
  }

  function showModal(address: Market['address'], type: 'borrow' | 'deposit') {
    const data = markets.find((market) => {
      return market.address === address;
    });

    handleModal({ content: { ...data, type } });
  }

  return (
    <div>
      {modal && (
        <>
          <Modal contractData={modalContent} closeModal={handleModal} />
          <Overlay closeModal={handleModal} />
        </>
      )}
      <Navbar walletAddress={walletAddress} />
      <CurrentNetwork network={network} />
      <Hero />
      <MaturitySelector title="Maturity Pools" />
      <MarketsList markets={markets} showModal={showModal} />
      <Footer />
    </div>
  );
};

export default Home;
