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
import SmartPoolChart from 'components/SmartPoolChart';
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
import { InterestRateModelProvider } from 'contexts/InterestRateModelContext';

import style from './style.module.scss';

import useModal from 'hooks/useModal';

import keys from './translations.json';

import parseTimestamp from 'utils/parseTimestamp';
import { getContractData } from 'utils/contracts';

//Contracts
import InterestRateModel from 'protocol/deployments/kovan/InterestRateModel.json';
import Auditor from 'protocol/deployments/kovan/Auditor.json';
import FixedLenderDAI from 'protocol/deployments/kovan/FixedLenderDAI.json';
import FixedLenderWETH from 'protocol/deployments/kovan/FixedLenderWETH.json';

interface Props {
  symbol: String;
}

const Asset: NextPage<Props> = ({ symbol }) => {
  const [page, setPage] = useState<number>(1);
  const lang: string = useContext(LangContext);
  const { modal, handleModal, modalContent } = useModal();

  const itemsPerPage = 5;

  const translations: { [key: string]: LangKeys } = keys;

  const auditorContract = getContractData(Auditor.address, Auditor.abi);
  const fixedLenders = [FixedLenderDAI, FixedLenderWETH];

  const filteredFixedLender = fixedLenders.find((fl) => fl.args[1] === symbol);
  const fixedLenderContract = getContractData(
    filteredFixedLender?.address!,
    filteredFixedLender?.abi!
  );

  const [maturities, setMaturities] = useState<Array<Maturity> | undefined>(undefined);

  const [marketData, setMarketData] = useState<UnformattedMarket | undefined>(undefined);

  useEffect(() => {
    if (!maturities) {
      getMarketData();
      getPools();
    }
  }, [auditorContract]);

  async function getMarketData() {
    const marketData = await auditorContract?.getMarketData(filteredFixedLender?.address);

    setMarketData(marketData);
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

  function showModal(type: String) {
    if (modalContent?.type) {
      //in the future we should handle the minimized modal status through a context here
      return;
    }

    if (marketData) {
      const market = {
        address: marketData[5],
        symbol: marketData[0],
        name: marketData[1],
        isListed: marketData[2],
        collateralFactor: parseFloat(ethers.utils.formatEther(marketData[3]))
      };

      handleModal({ content: { ...market, type } });
    }
  }

  return (
    <AuditorProvider value={Auditor}>
      <FixedLenderProvider value={fixedLenders}>
        <InterestRateModelProvider value={InterestRateModel}>
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
              <SmartPoolInfo showModal={(type: string) => showModal(type)} />
              <SmartPoolChart />
            </div>
            <section className={style.assetData}>
              <div className={style.assetContainer}>
                <AssetSelector title={true} />
              </div>
              <div className={style.assetMetricsContainer}></div>
            </section>
            <section className={style.graphContainer}>
              <div className={style.leftColumn}>
                <AssetTable
                  maturities={maturities?.slice(itemsPerPage * (page - 1), itemsPerPage * page)}
                  showModal={(type: string) => showModal(type)}
                />
                <Paginator
                  total={maturities?.length ?? 0}
                  itemsPerPage={5}
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
              <AssetInfo title={translations[lang].price} value="$4,213.62" />
              <AssetInfo title={translations[lang].reserveFactor} value="20%" />
              <AssetInfo title={translations[lang].collateralFactor} value="75%" />
            </div>
            <div className={style.maturitiesContainer}>
              {maturities?.slice(0, 3)?.map((maturity) => {
                return <MaturityInfo maturity={maturity} key={maturity.value} />;
              })}
            </div>
          </section>
        </InterestRateModelProvider>
      </FixedLenderProvider>
    </AuditorProvider>
  );
};

export async function getServerSideProps(req: NextApiRequest) {
  const tokenSymbol: string = req?.query?.id as string;

  return {
    props: {
      symbol: tokenSymbol.toUpperCase()
    }
  };
}

export default Asset;
