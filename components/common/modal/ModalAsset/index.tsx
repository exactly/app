import Image from 'next/image';

import formatNumber from 'utils/formatNumber';
import parseSymbol from 'utils/parseSymbol';

import AssetSelector from 'components/AssetSelector';

import styles from './style.module.scss';

type Props = {
  asset: string;
  amount?: string;
  editable?: boolean;
  defaultAddress?: string;
};

function ModalAsset({ asset, amount, editable, defaultAddress }: Props) {
  const parsedSymbol = parseSymbol(asset);

  return (
    <div className={styles.assetContainer}>
      <div className={styles.informationContainer}>
        {!editable && (
          <>
            <Image
              src={`/img/assets/${asset.toLowerCase()}.png`}
              alt={asset}
              width="24"
              height="24"
            />
            <p className={styles.assetName}>{parsedSymbol}</p>
          </>
        )}
        {editable && <AssetSelector defaultAddress={defaultAddress} />}
      </div>
      {amount && (
        <div className={styles.assetPriceContainer}>
          <p className={styles.price}>
            {formatNumber(amount, asset)} {parsedSymbol}
          </p>
          <p className={styles.secondaryPrice}>$ 1M</p>
        </div>
      )}
    </div>
  );
}

export default ModalAsset;
