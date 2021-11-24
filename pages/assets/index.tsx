import AssetSelector from 'components/AssetSelector';
import CurrentNetwork from 'components/CurrentNetwork';
import Navbar from 'components/Navbar';

function Asset(props: any) {
  const { walletAddress, network } = props;

  return (
    <div>
      <Navbar walletAddress={walletAddress} />
      <CurrentNetwork network={network} />
      <AssetSelector title={true} />
    </div>
  );
}

export default Asset;
