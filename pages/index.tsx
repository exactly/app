import { useState, useEffect, useRef, useContext } from 'react';
import type { NextPage } from 'next';

import { ethers } from 'ethers';

import MarketsList from 'components/MarketsList';
import MaturitySelector from 'components/MaturitySelector';
import Modal from 'components/Modal';
import Navbar from 'components/Navbar';
import Hero from 'components/Hero';
import CurrentNetwork from 'components/CurrentNetwork';
import Footer from 'components/Footer';

import useContract from 'hooks/useContract';
import useModal from 'hooks/useModal';

import ContractContext from 'contexts/ContractContext';

import { Market } from 'types/Market';
import Overlay from 'components/Overlay';
import MobileNavbar from 'components/MobileNavbar';

const Home: NextPage = (props: any) => {
  const { walletAddress, network } = props;
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

    const marketsParsed = marketsAddresses.map(async (address: string) => {
      // const marketData = await contract?.markets(address);
      // return { ...marketData, address };
    });

    // Promise.all(marketsParsed).then((data: Array<any>) => {
    //   setMarkets(formatMarkets(data));
    // });
  }

  function formatMarkets(markets: any) {
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

      market['address'] = markets[i].address;
      market['symbol'] = markets[i].symbol;
      market['name'] = markets[i][0];
      market['isListed'] = markets[i].isListed;
      market['collateralFactor'] = parseFloat(
        ethers.utils.formatEther(markets[i].collateralFactor)
      );

      formattedMarkets = [...formattedMarkets, market];
    }

    return formattedMarkets;
  }

  function showModal(address: Market['address']) {
    const data = markets.find((market) => {
      return market.address === address;
    });

    handleModal({ content: data });
  }

  return (
    <div>
      {modal && (
        <>
          <Modal contractData={modalContent} closeModal={handleModal} />
          <Overlay closeModal={handleModal} />
        </>
      )}

      <MobileNavbar walletAddress={walletAddress} network={network} />

      {/* <Navbar walletAddress={walletAddress} /> */}
      {/* <CurrentNetwork network={network} /> */}

      <Hero />
      <MaturitySelector />
      <MarketsList markets={markets} showModal={showModal} />
      <Footer />
    </div>
  );
};

export default Home;
