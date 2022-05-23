import { useContext, useEffect, useState } from 'react';
import type { NextApiRequest, NextPage } from 'next';
import { ethers } from 'ethers';
import dayjs from 'dayjs';

import AssetSelector from 'components/AssetSelector';
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

import { Maturity } from 'types/Maturity';
import { LangKeys } from 'types/Lang';
import { UnformattedMarket } from 'types/UnformattedMarket';

import { AuditorProvider } from 'contexts/AuditorContext';
import LangContext from 'contexts/LangContext';
import { FixedLenderProvider } from 'contexts/FixedLenderContext';
import { AccountDataContext } from 'contexts/AccountDataContext';
import { useWeb3Context } from 'contexts/Web3Context';
import PreviewerContext from 'contexts/PreviewerContext';

import style from './style.module.scss';

import useModal from 'hooks/useModal';

import keys from './translations.json';

import parseTimestamp from 'utils/parseTimestamp';
import { getContractData } from 'utils/contracts';
import getExchangeRate from 'utils/getExchangeRate';

//Contracts
import Auditor from 'protocol/deployments/kovan/Auditor.json';
import FixedLenderDAI from 'protocol/deployments/kovan/FixedLenderDAI.json';
import FixedLenderWETH from 'protocol/deployments/kovan/FixedLenderWETH.json';

interface Props {
  symbol: string;
  price: number;
}

const Asset: NextPage<Props> = ({ symbol, price }) => {
  const { modal, handleModal, modalContent } = useModal();

  const { accountData, setAccountData } = useContext(AccountDataContext);
  const previewerData = useContext(PreviewerContext);
  const { walletAddress } = useWeb3Context();
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [page, setPage] = useState<number>(1);
  const [maturities, setMaturities] = useState<Array<Maturity> | undefined>(undefined);
  const [marketData, setMarketData] = useState<UnformattedMarket | undefined>(undefined);

  const itemsPerPage = 3;

  const auditorContract = getContractData(Auditor.address, Auditor.abi);
  const previewerContract = getContractData(previewerData.address!, previewerData.abi!);

  const fixedLenders = [FixedLenderDAI, FixedLenderWETH];

  const filteredFixedLender = fixedLenders.find((fl) => fl.args[1] === symbol);

  const fixedLenderContract = getContractData(
    filteredFixedLender?.address!,
    filteredFixedLender?.abi!
  );

  useEffect(() => {
    if (!maturities) {
      getMarketData();
      getPools();
    }
  }, [auditorContract, symbol]);

  useEffect(() => {
    if (!walletAddress) return;
    getAccountData();
  }, [walletAddress]);

  async function getMarketData() {
    const marketData = await auditorContract?.getMarketData(filteredFixedLender?.address);

    setMarketData(marketData);
  }

  async function getAccountData() {
    try {
      const data = await previewerContract?.extendedAccountData(walletAddress);
      setAccountData(data);
    } catch (e) {
      console.log(e);
    }
  }

  async function getPools() {
    const currentTimestamp = dayjs().unix();
    const interval = 604800;
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
  }

  function showModal(type: string, maturity: string | undefined) {
    if (modalContent?.type) {
      //in the future we should handle the minimized modal status through a context here
      return;
    }

    if (marketData) {
      const market = {
        market: marketData[5],
        symbol: marketData[0],
        name: marketData[1],
        isListed: marketData[2],
        collateralFactor: parseFloat(ethers.utils.formatEther(marketData[3])),
        maturity: maturity ?? undefined
      };

      handleModal({ content: { ...market, type } });
    }
  }

  return (
    <AuditorProvider value={Auditor}>
      <FixedLenderProvider value={fixedLenders}>
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
            <SmartPoolInfo showModal={showModal} symbol={symbol} />
          </div>
          <section className={style.assetData}>
            <div className={style.assetContainer}>
              {marketData && <AssetSelector title={true} defaultAddress={marketData[5]} />}
            </div>
            <div className={style.assetMetricsContainer}></div>
          </section>
          <section className={style.graphContainer}>
            <div className={style.leftColumn}>
              <AssetTable
                maturities={maturities?.slice(itemsPerPage * (page - 1), itemsPerPage * page)}
                market={filteredFixedLender?.address!}
                showModal={showModal}
              />
              <Paginator
                total={maturities?.length ?? 0}
                itemsPerPage={itemsPerPage}
                handleChange={(page) => setPage(page)}
                currentPage={page}
              />
            </div>
            <div className={style.assetGraph}>
              <PoolsChart />
            </div>
          </section>
          <h2 className={style.assetTitle}>{translations[lang].assetDetails}</h2>
          <div className={style.assetInfoContainer}>
            <AssetInfo title={translations[lang].price} value={`$${Math.ceil(price)}`} />
            <AssetInfo title={translations[lang].reserveFactor} value="20%" />
            {marketData && (
              <AssetInfo
                title={translations[lang].collateralFactor}
                value={parseFloat(ethers.utils.formatEther(marketData[3])) * 100}
                symbol="%"
              />
            )}
          </div>
          <div className={style.maturitiesContainer}>
            {maturities?.slice(0, 3)?.map((maturity) => {
              return <MaturityInfo maturity={maturity} key={maturity.value} symbol={symbol} />;
            })}
          </div>
        </section>
      </FixedLenderProvider>
    </AuditorProvider>
  );
};

export async function getServerSideProps(req: NextApiRequest) {
  const tokenSymbol: string = req?.query?.id as string;
  const symbol = tokenSymbol.toUpperCase() === 'ETH' ? 'WETH' : tokenSymbol.toUpperCase();

  const price = await getExchangeRate(tokenSymbol);

  return {
    props: {
      symbol: symbol,
      price
    }
  };
}

export default Asset;
