import { useState, useEffect } from 'react';
import type { NextPage } from 'next';

import { ethers } from 'ethers';

import MarketsList from 'components/MarketsList';
import MaturitySelector from 'components/MaturitySelector';
import Navbar from 'components/Navbar';
import CurrentNetwork from 'components/CurrentNetwork';
import Footer from 'components/Footer';
import MobileNavbar from 'components/MobileNavbar';
import SmartPoolList from 'components/SmartPoolList';
import DepositModalMP from 'components/DepositModalMP';
import BorrowModal from 'components/BorrowModal';
import DepositModalSP from 'components/DepositModalSP';

import useModal from 'hooks/useModal';

import { AuditorProvider } from 'contexts/AuditorContext';
import { FixedLenderProvider } from 'contexts/FixedLenderContext';
import { PreviewerProvider } from 'contexts/PreviewerContext';

import { Market } from 'types/Market';
import { UnformattedMarket } from 'types/UnformattedMarket';

import dictionary from 'dictionary/en.json';

import { getContractData } from 'utils/contracts';

//Contracts
import Auditor from 'protocol/deployments/kovan/Auditor.json';
import FixedLenderDAI from 'protocol/deployments/kovan/FixedLenderDAI.json';
import FixedLenderWETH from 'protocol/deployments/kovan/FixedLenderWETH.json';
import Previewer from 'protocol/deployments/kovan/Previewer.json';

interface Props {}

const Pools: NextPage<Props> = () => {
  const { modal, handleModal, modalContent } = useModal();

  const [markets, setMarkets] = useState<Array<Market>>([]);

  const auditorContract = getContractData(Auditor.address!, Auditor.abi!);

  useEffect(() => {
    if (auditorContract) {
      getMarkets();
    }
  }, []);

  async function getMarkets() {
    const marketsAddresses = await auditorContract?.getAllMarkets();

    const marketsData: Array<UnformattedMarket> = [];

    marketsAddresses.map((address: string) => {
      marketsData.push(auditorContract?.getMarketData(address));
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
        market: '',
        symbol: '',
        name: '',
        isListed: false,
        collateralFactor: 0
      };

      market['market'] = markets[i][5];
      market['symbol'] = markets[i][0];
      market['name'] = markets[i][1];
      market['isListed'] = markets[i][2];
      market['collateralFactor'] = parseFloat(ethers.utils.formatEther(markets[i][3]));

      formattedMarkets = [...formattedMarkets, market];
    }

    return formattedMarkets;
  }

  function showModal(marketData: Market, type: String) {
    if (modalContent?.type) {
      //in the future we should handle the minimized modal status through a context here
      return;
    }

    const data = markets.find((market) => {
      return market.market === marketData.market;
    });

    handleModal({ content: { ...data, type } });
  }

  return (
    <PreviewerProvider value={Previewer}>
      <AuditorProvider value={Auditor}>
        <FixedLenderProvider value={[FixedLenderDAI, FixedLenderWETH]}>
          {modal && modalContent?.type == 'deposit' && (
            <DepositModalMP data={modalContent} closeModal={handleModal} />
          )}

          {modal && modalContent?.type == 'smartDeposit' && (
            <DepositModalSP data={modalContent} closeModal={handleModal} />
          )}

          {modal && modalContent?.type == 'borrow' && (
            <BorrowModal data={modalContent} closeModal={handleModal} />
          )}

          <MobileNavbar />
          <Navbar />
          <CurrentNetwork />

          <div style={{ marginTop: '180px' }}>
            <SmartPoolList markets={markets} showModal={showModal} />
          </div>

          <MaturitySelector title={dictionary.maturityPools} />

          <MarketsList markets={markets} showModal={showModal} />
          <Footer />
        </FixedLenderProvider>
      </AuditorProvider>
    </PreviewerProvider>
  );
};

export default Pools;
