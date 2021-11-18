import AssetSelector from 'components/AssetSelector';
import CurrentNetwork from 'components/CurrentNetwork';
import Navbar from 'components/Navbar';

function Asset() {
  return (
    <div>
      <Navbar />
      <CurrentNetwork />
      <AssetSelector title={true} />
    </div>
  );
}

export default Asset;
