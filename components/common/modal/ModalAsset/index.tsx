import { useContext, useMemo } from 'react';
import { utils } from 'ethers';
import Skeleton from 'react-loading-skeleton';

import formatNumber from 'utils/formatNumber';
import parseSymbol from 'utils/parseSymbol';

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

function ModalAsset({ asset, assetTitle, amount, amountTitle }: Props) {
  const { accountData } = useContext(AccountDataContext);
  const { market } = useContext(MarketContext);

  const parsedSymbol = useMemo(() => {
    return parseSymbol(asset);
  }, [asset]);

  const exchangeRate = useMemo(() => {
    if (!accountData || !asset) return 1;

    return parseFloat(utils.formatEther(accountData[asset].usdPrice));
  }, [parsedSymbol, accountData]);

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
          <p className={styles.secondaryPrice}>
            ${formatNumber(parseFloat(amount) * exchangeRate, 'usd')}
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
