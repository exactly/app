import type { NextPage } from 'next';
import axios from 'axios';

import AssetSelector from 'components/AssetSelector';
import CurrentNetwork from 'components/CurrentNetwork';
import Navbar from 'components/Navbar';

import { Network } from 'types/Network';
import { Contract } from 'types/Contract';
import { AuditorProvider } from 'contexts/AuditorContext';

import style from './style.module.scss'

interface Props {
  walletAddress: string;
  network: Network;
  auditor: Contract;
}

const Asset: NextPage<Props> = ({ walletAddress, network, auditor }) => {
  return (
    <AuditorProvider value={auditor}>
      <Navbar walletAddress={walletAddress} />
      {/* <CurrentNetwork network={network} /> */}
      <section className={style.container}>
        <section className={style.assetData}>
          <div className={style.assetContainer}>

            <AssetSelector title={true} />
          </div>
          <div className={style.assetMetrics}>
            <div>

            </div>
          </div>
        </section>
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

