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
  auditor: Contract;
  asset: Contract
}


const Asset: NextPage<Props> = ({ walletAddress, network, auditor, asset }) => {
  return (
    <div>
      <Navbar walletAddress={walletAddress} />
      <CurrentNetwork network={network} />
      <AssetSelector title={true} auditor={auditor} />
    </div>
  );
};

export async function getStaticProps({params}: any) {
  const asset = params.asset;
  const getAuditorAbi = await axios.get('https://abi-versions.s3.amazonaws.com/latest/contracts/Auditor.sol/Auditor.json')
  const getFixedLenderAbi = await axios.get('https://abi-versions.s3.amazonaws.com/latest/contracts/FixedLender.sol/FixedLender.json')
  const addresses = await axios.get('https://abi-versions.s3.amazonaws.com/latest/addresses.json');
  const auditorAddress = addresses?.data?.auditor;
  console.log(addresses.data, `fixedLender${asset.toUpperCase()}`)
  const fixedLenderAddress = addresses?.data[`fixedLender${asset.toUpperCase()}`];

  console.log(fixedLenderAddress)
  return {
    props: {
      auditor: {
        abi: getAuditorAbi.data,
        address: auditorAddress
      },
      asset: {
        abi: getFixedLenderAbi.data,
        address: fixedLenderAddress
      }
    },
  }
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true
  };
}

export default Asset;
