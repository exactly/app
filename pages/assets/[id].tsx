import type { NextPage } from 'next';
import axios from 'axios';
import dayjs from 'dayjs';

import AssetSelector from 'components/AssetSelector';
import CurrentNetwork from 'components/CurrentNetwork';
import Navbar from 'components/Navbar';

import { Network } from 'types/Network';
import { Contract } from 'types/Contract';
import { AuditorProvider } from 'contexts/AuditorContext';

import style from './style.module.scss'
import useContract from 'hooks/useContract';
import AssetTable from 'components/AssetTable';
import { useEffect, useState } from 'react';
import { Maturity } from 'types/Maturity';

interface Props {
  walletAddress: string;
  network: Network;
  auditor: Contract;
}

const Asset: NextPage<Props> = ({ walletAddress, network, auditor }) => {
  const auditorContract = useContract(auditor.address, auditor.abi);
  const [maturities, setMaturities] = useState<Array<Maturity> | undefined>(undefined);

  async function getPools() {
    const pools = await auditorContract?.contract?.getFuturePools();

    const dates = pools?.map((pool: any) => {
      return pool.toString();
    });

    const formattedDates = dates?.map((date: any) => {
      return {
        value: date,
        label: dayjs.unix(parseInt(date)).format('DD-MMM-YY')
      };
    });

    setMaturities(formattedDates)
  }

  useEffect(() => {
    if (!maturities) {
      getPools();
    }
  }, [auditorContract]);

  return (
    <AuditorProvider value={auditor}>
      <Navbar walletAddress={walletAddress} />
      {/* <CurrentNetwork network={network} /> */}
      <section className={style.container}>
        <section className={style.assetData}>
          <div className={style.assetContainer}>
            <AssetSelector title={true} />
          </div>
          <div className={style.assetMetricsContainer}>
            <div className={style.assetMetrics}>
              <span className={style.title}>Net rate</span>
              <span className={style.value}>0.19%</span>
            </div>
            <div className={style.assetMetrics}>
              <span className={style.title}>Supply APY</span>
              <span className={style.value}>0.08%</span>
            </div>
            <div className={style.assetMetrics}>
              <span className={style.title}>Distribution APY</span>
              <span className={style.value}>0.11%</span>
            </div>
            <div className={style.assetMetrics}>
              <span className={style.title}>Total supply</span>
              <span className={style.value}>$6,123,456</span>
            </div>
          </div>
        </section>
        <AssetTable maturities={maturities}/>
      </section>
    </AuditorProvider>
  );
};

export default Asset;

export async function getServerSideProps() {
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
      }
    }
  };
}

