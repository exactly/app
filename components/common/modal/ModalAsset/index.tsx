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
};

function ModalAsset({ asset, amount }: Props) {
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
        <AssetSelector />
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
