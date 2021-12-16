import type { NextPage } from 'next';

import AssetSelector from 'components/AssetSelector';
import CurrentNetwork from 'components/CurrentNetwork';
import Navbar from 'components/Navbar';

import { Network } from 'types/Network';
interface Props {
  walletAddress: string;
  network: Network;
}

const Asset: NextPage<Props> = ({ walletAddress, network }) => {
  return (
    <div>
      <Navbar walletAddress={walletAddress} />
      <CurrentNetwork network={network} />
      <AssetSelector title={true} />
    </div>
  );
};

export default Asset;
