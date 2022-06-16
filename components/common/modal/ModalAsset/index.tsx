import { useContext, useEffect, useState } from 'react';
import Image from 'next/image';
import Skeleton from 'react-loading-skeleton';

import formatNumber from 'utils/formatNumber';
import parseSymbol from 'utils/parseSymbol';

import AssetSelector from 'components/AssetSelector';

import AccountDataContext from 'contexts/AccountDataContext';

import styles from './style.module.scss';
import { ethers } from 'ethers';

type Props = {
  asset: string;
  amount?: string;
  editable?: boolean;
  defaultAddress?: string;
};

function ModalAsset({ asset, amount, editable, defaultAddress }: Props) {
  const { accountData } = useContext(AccountDataContext);

  const [exchangeRate, setExchangeRate] = useState(1);

  const parsedSymbol = parseSymbol(asset);

  useEffect(() => {
    getRate();
  }, [parsedSymbol, accountData]);

  async function getRate() {
    if (!accountData || !asset) return;

    const rate = parseFloat(ethers.utils.formatEther(accountData[asset].oraclePrice));
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
      {amount ? (
        <div className={styles.assetPriceContainer}>
          <p className={styles.price}>
            {formatNumber(amount, asset)} {parsedSymbol}
          </p>
          <p className={styles.secondaryPrice}>
            $ {formatNumber(parseFloat(amount) * exchangeRate, 'usd')}
          </p>
        </div>
      ) : (
        <div className={styles.skeleton}>
          <Skeleton count={2} width={50} />
        </div>
      )}
    </div>
  );
}

export default ModalAsset;
