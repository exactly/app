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
import { AccountDataProvider } from 'contexts/AccountDataContext';
import { useWeb3Context } from 'contexts/Web3Context';
import { PreviewerProvider } from 'contexts/PreviewerContext';

import { Market } from 'types/Market';
import { UnformattedMarket } from 'types/UnformattedMarket';
import { AccountData } from 'types/AccountData';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';

import dictionary from 'dictionary/en.json';

import { getContractData } from 'utils/contracts';

import getABI from 'config/abiImporter';

interface Props {}

const Pools: NextPage<Props> = () => {
  const { modal, handleModal, modalContent } = useModal();
  const { network, walletAddress } = useWeb3Context();

  const [markets, setMarkets] = useState<Array<Market>>([]);

  const [accountData, setAccountData] = useState<AccountData>();

  const { Previewer, Auditor, FixedLenderDAI, FixedLenderWETH, FixedLenderWBTC, FixedLenderUSDC } =
    getABI(network?.name);

  useEffect(() => {
    if (Previewer) {
      getMarkets();
    }
  }, [Previewer]);

  useEffect(() => {
    getAccountData();
  }, [walletAddress]);

  async function getMarkets() {
    const previewerContract = getContractData(network?.name!, Previewer.address!, Previewer.abi!);

    const marketsData = await previewerContract?.accounts(
      '0x000000000000000000000000000000000000dEaD'
    );

    setMarkets(formatMarkets(marketsData));
  }

  async function getAccountData() {
    try {
      const previewerContract = getContractData(network?.name, Previewer.address!, Previewer.abi!);
      const data = await previewerContract?.accounts(walletAddress);
      const newAccountData: AccountData = {};

      data.forEach((fixedLender: FixedLenderAccountData) => {
        newAccountData[fixedLender.assetSymbol] = fixedLender;
      });

      setAccountData(newAccountData);
    } catch (e) {
      console.log(e);
    }
  }

  function formatMarkets(markets: Array<any>) {
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

      market['market'] = markets[i].market;
      market['symbol'] = markets[i].assetSymbol;
      market['name'] = markets[i].assetSymbol;
      market['isListed'] = true;
      market['collateralFactor'] = parseFloat(ethers.utils.formatEther(markets[i].adjustFactor));

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
    <>
      {Auditor && (
        <PreviewerProvider value={Previewer}>
          <AccountDataProvider value={{ accountData, setAccountData }}>
            <AuditorProvider value={Auditor}>
              <FixedLenderProvider
                value={[FixedLenderDAI, FixedLenderWETH, FixedLenderWBTC, FixedLenderUSDC]}
              >
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
          </AccountDataProvider>
        </PreviewerProvider>
      )}
    </>
  );
};

export default Pools;
