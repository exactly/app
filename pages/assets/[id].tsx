import { useContext, useEffect, useState } from 'react';
import type { NextPage } from 'next';
import axios from 'axios';
import dayjs from 'dayjs';

import AssetSelector from 'components/AssetSelector';
import Navbar from 'components/Navbar';
import PoolsChart from 'components/PoolsChart';
import MaturityInfo from 'components/MaturityInfo';
import AssetInfo from 'components/AssetInfo';
import AssetTable from 'components/AssetTable';
import SmartPoolInfo from 'components/SmartPoolInfo';

import { Network } from 'types/Network';
import { Contract } from 'types/Contract';
import { Maturity } from 'types/Maturity';
import { LangKeys } from 'types/Lang';

import { AuditorProvider } from 'contexts/AuditorContext';
import LangContext from 'contexts/LangContext';

import style from './style.module.scss';

import useContract from 'hooks/useContract';

import keys from './translations.json';
import SmartPoolChart from 'components/SmartPoolChart';

interface Props {
  walletAddress: string;
  network: Network;
  auditor: Contract;
}

const Asset: NextPage<Props> = ({ walletAddress, network, auditor }) => {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const auditorContract = useContract(auditor.address, auditor.abi);
  const [maturities, setMaturities] = useState<Array<Maturity> | undefined>(
    undefined
  );

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

  useEffect(() => {
    if (!maturities) {
      getPools();
    }
  }, [auditorContract]);

  return (
    <AuditorProvider value={auditor}>
      <Navbar walletAddress={walletAddress} />
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
          <AssetTable maturities={maturities?.slice(0, 5)} />
          <div className={style.assetGraph}>
            <PoolsChart />
          </div>
        </section>
        <h2>{translations[lang].assetDetails}</h2>
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
        <div className={style.smartPoolContainer}>
          <SmartPoolInfo />
          <SmartPoolChart />
        </div>
      </section>
    </AuditorProvider>
  );
};

export default Asset;

export async function getServerSideProps() {
  const getAuditorAbi = await axios.get(
    'https://exactly-abi.s3.amazonaws.com/latest/contracts/Auditor.sol/Auditor.json'
  );
  const getFixedLenderAbi = await axios.get(
    'https://exactly-abi.s3.amazonaws.com/latest/contracts/FixedLender.sol/FixedLender.json'
  );
  const getInterestRateModelAbi = await axios.get(
    'https://exactly-abi.s3.amazonaws.com/latest/contracts/InterestRateModel.sol/InterestRateModel.json'
  );
  const addresses = await axios.get(
    'https://exactly-abi.s3.amazonaws.com/latest/addresses.json'
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
