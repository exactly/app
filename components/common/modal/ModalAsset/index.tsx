import { useEffect, useState } from 'react';
import Image from 'next/image';

import formatNumber from 'utils/formatNumber';
import parseSymbol from 'utils/parseSymbol';
import getExchangeRate from 'utils/getExchangeRate';

import AssetSelector from 'components/AssetSelector';

import styles from './style.module.scss';

type Props = {
  asset: string;
  amount?: string;
  editable?: boolean;
  defaultAddress?: string;
};

function ModalAsset({ asset, amount, editable, defaultAddress }: Props) {
  const [exchangeRate, setExchangeRate] = useState(1);

  const parsedSymbol = parseSymbol(asset);

  useEffect(() => {
    if (
      !parsedSymbol ||
      parsedSymbol.toLocaleLowerCase() === 'dai' ||
      parsedSymbol.toLocaleLowerCase() === 'usdc'
    )
      return;

    getRate();
  }, [parsedSymbol]);

  async function getRate() {
    const rate = await getExchangeRate(parsedSymbol!);
    setExchangeRate(rate);
  }

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
          <p className={styles.secondaryPrice}>
            $ {(parseFloat(amount) * exchangeRate).toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}

export default ModalAsset;
