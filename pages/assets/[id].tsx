import { useContext, useEffect, useState } from 'react';
import type { GetStaticProps, NextPage } from 'next';
import { Contract, ethers } from 'ethers';
import dayjs from 'dayjs';

import Navbar from 'components/Navbar';
import PoolsChart from 'components/PoolsChart';
import MaturityInfo from 'components/MaturityInfo';
import AssetInfo from 'components/AssetInfo';
import AssetTable from 'components/AssetTable';
import SmartPoolInfo from 'components/SmartPoolInfo';
import MobileNavbar from 'components/MobileNavbar';
import Paginator from 'components/Paginator';
import DepositModalMP from 'components/DepositModalMP';
import BorrowModal from 'components/BorrowModal';
import DepositModalSP from 'components/DepositModalSP';
import Footer from 'components/Footer';

import { Maturity } from 'types/Maturity';
import { LangKeys } from 'types/Lang';
import { AccountData } from 'types/AccountData';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';

import { AccountDataProvider } from 'contexts/AccountDataContext';
import LangContext from 'contexts/LangContext';
import { FixedLenderProvider } from 'contexts/FixedLenderContext';
import { useWeb3Context } from 'contexts/Web3Context';
import { PreviewerProvider } from 'contexts/PreviewerContext';

import style from './style.module.scss';

import useModal from 'hooks/useModal';

import keys from './translations.json';

import parseTimestamp from 'utils/parseTimestamp';
import { getContractData } from 'utils/contracts';
import { getSymbol } from 'utils/utils';

import getABI from 'config/abiImporter';

interface Props {
  symbol: string;
}

const Asset: NextPage<Props> = ({ symbol }) => {
  const { modal, handleModal, modalContent } = useModal();

  const { network, walletAddress } = useWeb3Context();
  const lang: string = useContext(LangContext);

  const translations: { [key: string]: LangKeys } = keys;

  const [page, setPage] = useState<number>(1);
  const [maturities, setMaturities] = useState<Array<Maturity> | undefined>(undefined);
  const [marketData, setMarketData] = useState<FixedLenderAccountData | undefined>(undefined);
  const [accountData, setAccountData] = useState<AccountData>();
  const [fixedLenderContract, setFixedLenderContract] = useState<Contract | undefined>(undefined);
  const [price, setPrice] = useState<number | undefined>(undefined);

  const { Previewer, FixedLenders } = getABI(network?.name);

  const previewerContract = getContractData(network?.name!, Previewer.address!, Previewer.abi!);
  const itemsPerPage = 3;

  useEffect(() => {
    if (!FixedLenders) return;

    getFixedLenderContract();
  }, [network]);

  useEffect(() => {
    if (!fixedLenderContract) return;

    getPools();
  }, [fixedLenderContract]);

  useEffect(() => {
    if (!maturities && Previewer) {
      getMarketData();
    }
  }, [Previewer, symbol]);

  useEffect(() => {
    if (!walletAddress) return;
    getAccountData();
  }, [walletAddress]);

  async function getMarketData() {
    try {
      const marketsData = await previewerContract?.accounts(
        '0x000000000000000000000000000000000000dEaD'
      );

      const filteredMarket = marketsData.find(
        (market: FixedLenderAccountData) => market.assetSymbol === symbol
      );

      const {
        market,
        assetSymbol,
        maturitySupplyPositions,
        maturityBorrowPositions,
        smartPoolAssets,
        smartPoolShares,
        oraclePrice,
        penaltyRate,
        adjustFactor,
        decimals,
        isCollateral
      } = filteredMarket;

      setMarketData({
        market,
        assetSymbol,
        maturitySupplyPositions,
        maturityBorrowPositions,
        smartPoolAssets,
        smartPoolShares,
        oraclePrice,
        penaltyRate,
        adjustFactor,
        decimals,
        isCollateral
      });
    } catch (e) {
      console.log(e);
    }
  }

  async function getPools() {
    try {
      const currentTimestamp = dayjs().unix();
      const interval = 2419200;
      let timestamp = currentTimestamp - (currentTimestamp % interval);

      const maxPools = await fixedLenderContract?.maxFuturePools();
      const pools = [];

      for (let i = 0; i < maxPools; i++) {
        timestamp += interval;
        pools.push(timestamp);
      }

      const dates = pools?.map((pool: any) => {
        return pool.toString();
      });

      const formattedDates = dates?.map((date: any) => {
        return {
          value: date,
          label: parseTimestamp(date)
        };
      });

      setMaturities(formattedDates);
    } catch (e) {
      console.log(e);
    }
  }

  async function getAccountData() {
    try {
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

  async function getFixedLenderContract() {
    const filteredFixedLender = FixedLenders.find((contract: Contract) => {
      const contractSymbol = getSymbol(
        contract.address!,
        network?.name ?? process.env.NEXT_PUBLIC_NETWORK
      );
      return contractSymbol == symbol;
    });

    const fixedLender = await getContractData(
      network?.name,
      filteredFixedLender?.address!,
      filteredFixedLender?.abi!
    );
    setFixedLenderContract(fixedLender);
  }

  function showModal(type: string, maturity: string | undefined) {
    if (modalContent?.type) {
      //in the future we should handle the minimized modal status through a context here
      return;
    }
    if (marketData) {
      const market = {
        market: marketData.market,
        symbol: marketData.assetSymbol,
        name: marketData.assetSymbol,
        isListed: true,
        collateralFactor: parseFloat(ethers.utils.formatEther(marketData.adjustFactor)),
        maturity: maturity
      };

      handleModal({ content: { ...market, type } });
    }
  }

  return (
    <>
      {Previewer && (
        <PreviewerProvider value={Previewer}>
          <AccountDataProvider value={{ accountData, setAccountData }}>
            <FixedLenderProvider value={FixedLenders}>
              <MobileNavbar />
              <Navbar />

              {modal && modalContent?.type == 'deposit' && (
                <DepositModalMP data={modalContent} closeModal={handleModal} />
              )}

              {modal && modalContent?.type == 'smartDeposit' && (
                <DepositModalSP data={modalContent} closeModal={handleModal} />
              )}

              {modal && modalContent?.type == 'borrow' && (
                <BorrowModal data={modalContent} closeModal={handleModal} />
              )}

              <section className={style.container}>
                <div className={style.smartPoolContainer}>
                  <SmartPoolInfo
                    showModal={showModal}
                    symbol={symbol}
                    fixedLender={fixedLenderContract}
                  />
                </div>
                <section className={style.assetData}>
                  <div className={style.assetContainer}>
                    <p className={style.title}>{translations[lang].maturityPools}</p>
                  </div>
                  <div className={style.assetMetricsContainer}></div>
                </section>
                <section className={style.graphContainer}>
                  <div className={style.leftColumn}>
                    <AssetTable
                      maturities={maturities?.slice(itemsPerPage * (page - 1), itemsPerPage * page)}
                      market={fixedLenderContract?.address}
                      showModal={showModal}
                    />
                    {maturities && maturities.length > 0 && (
                      <Paginator
                        total={maturities.length}
                        itemsPerPage={itemsPerPage}
                        handleChange={(page) => setPage(page)}
                        currentPage={page}
                      />
                    )}
                  </div>
                  <div className={style.assetGraph}>
                    <PoolsChart />
                  </div>
                </section>
                <h2 className={style.assetTitle}>{translations[lang].assetDetails}</h2>
                <div className={style.assetInfoContainer}>
                  {marketData && (
                    <AssetInfo
                      title={translations[lang].price}
                      value={`$${parseFloat(ethers.utils.formatEther(marketData.oraclePrice))}`}
                    />
                  )}
                  {marketData && (
                    <AssetInfo
                      title={translations[lang].collateralFactor}
                      value={parseFloat(ethers.utils.formatEther(marketData.adjustFactor)) * 100}
                      symbol="%"
                    />
                  )}
                </div>
                <div className={style.maturitiesContainer}>
                  {maturities
                    ?.slice(itemsPerPage * (page - 1), itemsPerPage * page)
                    ?.map((maturity) => {
                      return (
                        <MaturityInfo
                          maturity={maturity}
                          key={maturity.value}
                          symbol={symbol}
                          fixedLender={fixedLenderContract}
                        />
                      );
                    })}
                  <div className={style.paginator}>
                    <Paginator
                      total={maturities?.length ?? 0}
                      itemsPerPage={itemsPerPage}
                      handleChange={(page) => setPage(page)}
                      currentPage={page}
                    />
                  </div>
                </div>
              </section>
              <Footer />
            </FixedLenderProvider>
          </AccountDataProvider>
        </PreviewerProvider>
      )}
    </>
  );
};

export default Asset;

export const getStaticProps: GetStaticProps = async (context) => {
  const tokenSymbol: string = context.params?.id as string;
  const symbol = tokenSymbol.toUpperCase() === 'ETH' ? 'WETH' : tokenSymbol.toUpperCase();

  return {
    props: {
      symbol: symbol
    }
  };
};

export async function getStaticPaths() {
  return {
    paths: ['/assets/dai', '/assets/eth', '/assets/usdc', '/assets/weth', '/assets/wbtc'],
    fallback: false
  };
}
