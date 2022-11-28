import React, { useContext, useMemo } from 'react';
import { formatFixed } from '@ethersproject/bignumber';
import Skeleton from 'react-loading-skeleton';

import formatNumber from 'utils/formatNumber';
import formatSymbol from 'utils/formatSymbol';

import AssetSelector from 'components/AssetSelector';

import AccountDataContext from 'contexts/AccountDataContext';
import { MarketContext } from 'contexts/MarketContext';

import styles from './style.module.scss';

type Props = {
  asset: string;
  assetTitle?: string;
  amount?: string;
  amountTitle?: string;
};

// TODO: amount should be a BigNumber
// refactor the operations using this component and add new prop "decimals" to do the parse here
function ModalAsset({ asset, assetTitle, amount, amountTitle }: Props) {
  const { accountData } = useContext(AccountDataContext);
  const { market } = useContext(MarketContext);

  const parsedSymbol = useMemo(() => {
    return formatSymbol(asset);
  }, [asset]);

  const exchangeRate = useMemo(() => {
    if (!accountData || !asset) return 1;

    return parseFloat(formatFixed(accountData[asset].usdPrice, 18));
  }, [accountData, asset]);

  return (
    <div className={styles.assetContainer}>
      <div className={styles.informationContainer}>
        {assetTitle && <p className={styles.title}>{assetTitle}</p>}
        <AssetSelector defaultAddress={market?.value} />
      </div>
      {amount ? (
        <div className={styles.assetPriceContainer}>
          {amountTitle && <p className={styles.title}>{amountTitle}</p>}
          <p className={styles.price}>
            {formatNumber(amount, asset)} {parsedSymbol}
          </p>
          <p className={styles.secondaryPrice}>${formatNumber(parseFloat(amount) * exchangeRate)}</p>
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
