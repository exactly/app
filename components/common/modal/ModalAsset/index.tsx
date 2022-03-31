import Image from 'next/image';

import styles from './style.module.scss';

type Props = {
  asset: string;
  amount?: string;
};

function ModalAsset({ asset, amount }: Props) {
  return (
    <div className={styles.assetContainer}>
      <div className={styles.informationContainer}>
        <Image src={`/img/assets/${asset.toLowerCase()}.png`} width="24" height="24" />
        <p className={styles.assetName}>{asset}</p>
      </div>
      {amount && (
        <div className={styles.assetPriceContainer}>
          <p className={styles.price}>
            {amount} {asset}
          </p>
          <p className={styles.secondaryPrice}>$ 1M</p>
        </div>
      )}
    </div>
  );
}

export default ModalAsset;
