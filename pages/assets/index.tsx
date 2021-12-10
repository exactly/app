import type { NextPage } from 'next';

import AssetSelector from 'components/AssetSelector';
import CurrentNetwork from 'components/CurrentNetwork';
import Navbar from 'components/Navbar';

import { Network } from 'types/Network';
import { Contract } from 'types/Contract';

import axios from 'axios';

interface Props {
  walletAddress: string;
  network: Network;
  auditor: Contract
}


const Asset: NextPage<Props> = ({ walletAddress, network, auditor }) => {
  console.log(444, auditor)
  return (
    <div>
      <Navbar walletAddress={walletAddress} />
      <CurrentNetwork network={network} />
      <AssetSelector title={true} auditor={auditor} />
    </div>
  );
};

export async function getStaticProps() {
  const getAuditorAbi = await axios.get('https://abi-versions.s3.amazonaws.com/latest/contracts/Auditor.sol/Auditor.json')
  const addresses = await axios.get('https://abi-versions.s3.amazonaws.com/latest/addresses.json');
  const auditorAddress = addresses?.data?.auditor;

  return {
    props: {
      auditor: {
        abi: getAuditorAbi.data,
        address: auditorAddress
      }
    },
  }
}

export default Asset;
