import { useContext, useEffect, useState } from 'react';
import type { NextApiRequest, NextPage } from 'next';
import axios from 'axios';
import dayjs from 'dayjs';
import { ethers } from 'ethers';

import AssetSelector from 'components/AssetSelector';
import Navbar from 'components/Navbar';
import PoolsChart from 'components/PoolsChart';
import MaturityInfo from 'components/MaturityInfo';
import AssetInfo from 'components/AssetInfo';
import AssetTable from 'components/AssetTable';
import SmartPoolInfo from 'components/SmartPoolInfo';
import SmartPoolChart from 'components/SmartPoolChart';
import MobileNavbar from 'components/MobileNavbar';

import { Network } from 'types/Network';
import { Contract } from 'types/Contract';
import { Maturity } from 'types/Maturity';
import { LangKeys } from 'types/Lang';

import { AuditorProvider } from 'contexts/AuditorContext';
import LangContext from 'contexts/LangContext';
import { FixedLenderProvider } from 'contexts/FixedLenderContext';
import { InterestRateModelProvider } from 'contexts/InterestRateModelContext';

import style from './style.module.scss';

import useContract from 'hooks/useContract';

import keys from './translations.json';
import Modal from 'components/Modal';
import useModal from 'hooks/useModal';
import { Market } from 'types/Market';
import { UnformattedMarket } from 'types/UnformattedMarket';
import { Dictionary } from 'types/Dictionary';
import Paginator from 'components/Paginator';

interface Props {
  walletAddress: string;
  network: string;
  auditor: Contract;
  tokenAddress: string;
  assetsAddresses: Dictionary<string>;
  fixedLender: Contract;
  interestRateModel: Contract;
}

const Asset: NextPage<Props> = ({ walletAddress, network, auditor, tokenAddress, assetsAddresses, fixedLender, interestRateModel }) => {
  const [page, setPage] = useState<number>(1)
  const lang: string = useContext(LangContext);
  const { modal, handleModal, modalContent } = useModal();

  const itemsPerPage = 5;

  const translations: { [key: string]: LangKeys } = keys;

  const auditorContract = useContract(auditor.address, auditor.abi);
  const [maturities, setMaturities] = useState<Array<Maturity> | undefined>(
    undefined
  );

  const [marketData, setMarketData] = useState<UnformattedMarket | undefined>(
    undefined
  );

  useEffect(() => {
    if (!maturities) {
      getMarketData();
      getPools();
    }
  }, [auditorContract]);

  async function getMarketData() {
    const marketData = await auditorContract?.contract?.getMarketData(
      tokenAddress
    );
    setMarketData(marketData);
  }

  async function getPools() {
    const pools = await auditorContract?.contract?.getFuturePools();

    const dates = pools?.map((pool: any) => {
      return pool.toString();
    });

    const formattedDates = dates?.map((date: any) => {
      return {
        value: date,
        label: dayjs.unix(parseInt(date)).format('DD-MMM-YYYY')
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
    <AuditorProvider value={auditor}>
      <FixedLenderProvider
        value={{ addresses: assetsAddresses, abi: fixedLender.abi }}
      >
        <InterestRateModelProvider value={interestRateModel}>
          <MobileNavbar walletAddress={walletAddress} network={network} />
          <Navbar walletAddress={walletAddress} />
          {modal && modalContent?.type != 'smartDeposit' && (
            <Modal
              contractData={modalContent}
              closeModal={handleModal}
              walletAddress={walletAddress}
            />
          )}
          <section className={style.container}>
            <section className={style.assetData}>
              <div className={style.assetContainer}>
                <AssetSelector title={true} />
              </div>
              <div className={style.assetMetricsContainer}>
                {/* <div className={style.assetMetrics}>
              <span className={style.title}>{translations[lang].netRate}</span>
              <span className={style.value}>0.19%</span>
            </div>
            <div className={style.assetMetrics}>
              <span className={style.title}>
                {translations[lang].supplyAPY}
              </span>
              <span className={style.value}>0.08%</span>
            </div>
            <div className={style.assetMetrics}>
              <span className={style.title}>
                {translations[lang].distributionAPY}
              </span>
              <span className={style.value}>0.11%</span>
            </div>
            <div className={style.assetMetrics}>
              <span className={style.title}>
                {translations[lang].totalSupply}
              </span>
              <span className={style.value}>$6,123,456</span>
            </div> */}
              </div>
            </section>
            <section className={style.graphContainer}>
              <div className={style.leftColumn}>
                <AssetTable maturities={maturities?.slice(itemsPerPage * (page - 1), itemsPerPage * page)} showModal={(type: string) => showModal(type)} />
                <Paginator total={maturities?.length ?? 0} itemsPerPage={5} handleChange={(page) => setPage(page)} currentPage={page} />
              </div>
              <div className={style.assetGraph}>
                <PoolsChart />
              </div>
            </section>
            <h2 className={style.assetTitle}>
              {translations[lang].assetDetails}
            </h2>
            <div className={style.assetInfoContainer}>
              <AssetInfo title={translations[lang].price} value="$4,213.62" />
              <AssetInfo title={translations[lang].reserveFactor} value="20%" />
              <AssetInfo
                title={translations[lang].collateralFactor}
                value="75%"
              />
            </div>
            <div className={style.maturitiesContainer}>
              {maturities?.slice(0, 3)?.map((maturity) => {
                return (
                  <MaturityInfo maturity={maturity} key={maturity.value} />
                );
              })}
            </div>
            <div className={style.smartPoolContainer}>
              <SmartPoolInfo />
              <SmartPoolChart />
            </div>
          </section>
        </InterestRateModelProvider>
      </FixedLenderProvider>
    </AuditorProvider>
  );
};

export default Asset;

export async function getServerSideProps(req: NextApiRequest) {
  const tokenSymbol: string = req?.query?.id as string;

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
      },
      tokenAddress: addresses.data[`FixedLender${tokenSymbol.toUpperCase()}`]
    }
  };
}
