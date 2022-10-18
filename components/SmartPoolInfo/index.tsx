import { FC, useContext, useEffect, useState } from 'react';
import { formatEther, formatUnits } from '@ethersproject/units';
import Skeleton from 'react-loading-skeleton';
import Image from 'next/image';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import AccountDataContext from 'contexts/AccountDataContext';
import ModalStatusContext from 'contexts/ModalStatusContext';
import { MarketContext } from 'contexts/AddressContext';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

import Button from 'components/common/Button';

import parseSymbol from 'utils/parseSymbol';
import formatNumber from 'utils/formatNumber';

interface Props {
  symbol: string;
}

const SmartPoolInfo: FC<Props> = ({ symbol }) => {
  const { walletAddress, connect } = useWeb3Context();

  const { accountData } = useContext(AccountDataContext);
  const { setOpen, setOperation } = useContext(ModalStatusContext);
  const { setMarket } = useContext(MarketContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [supply, setSupply] = useState<number | undefined>(undefined);
  const [demand, setDemand] = useState<number | undefined>(undefined);

  useEffect(() => {
    getSmartPoolData();
  }, [accountData, symbol]);

  async function getSmartPoolData() {
    if (!accountData || !symbol) return;

    try {
      const {
        totalFloatingBorrowAssets: borrowed,
        totalFloatingDepositAssets: supplied,
        decimals,
        oraclePrice
      } = accountData[parseSymbol(symbol)];
      const exchangeRate = parseFloat(formatEther(oraclePrice));

      setSupply(parseFloat(formatUnits(supplied, decimals)) * exchangeRate);
      setDemand(parseFloat(formatUnits(borrowed, decimals)) * exchangeRate);
    } catch (e) {
      console.log(e);
    }
  }

  function handleClick() {
    if (!walletAddress && connect) return connect();

    if (!accountData) return;

    const marketData = accountData[symbol];

    setOperation('deposit');
    setMarket({ value: marketData.market });
    setOpen(true);
  }

  return (
    <div className={styles.maturityContainer}>
      <div className={styles.titleContainer}>
        <p className={styles.title}>{translations[lang].smartPool}</p>
      </div>
      <ul className={styles.table}>
        <li className={styles.header}>
          <div className={styles.assetInfo}>
            <Image
              src={`/img/assets/${symbol.toLowerCase()}.svg`}
              alt={symbol}
              width={40}
              height={40}
            />
            <p className={styles.asset}>{parseSymbol(symbol)}</p>
          </div>
          <div className={styles.buttonContainer}>
            <Button
              text={translations[lang].deposit}
              className="tertiary"
              onClick={() => handleClick()}
            />
          </div>
        </li>
        <li className={styles.row}>
          <span className={styles.title}>{translations[lang].totalDeposited}</span>{' '}
          <p className={styles.value}>
            {(supply != undefined && `$${formatNumber(supply, symbol, true)}`) || <Skeleton />}
          </p>
        </li>
        <li className={styles.row}>
          <span className={styles.title}>{translations[lang].totalBorrowed}</span>{' '}
          <p className={styles.value}>
            {(demand != undefined && `$${formatNumber(demand, symbol, true)}`) || <Skeleton />}
          </p>
        </li>
        <li className={styles.row}>
          <span className={styles.title}> {translations[lang].liquidity}</span>{' '}
          <p className={styles.value}>
            {supply != undefined && demand != undefined ? (
              `$${formatNumber(supply - demand, symbol, true)}`
            ) : (
              <Skeleton />
            )}
          </p>
        </li>
        <li className={styles.row}>
          <span className={styles.title}>{translations[lang].utilizationRate}</span>{' '}
          <p className={styles.value}>
            {supply != undefined && demand != undefined ? (
              `${((demand / supply) * 100 || 0).toFixed(2)}%`
            ) : (
              <Skeleton />
            )}{' '}
          </p>
        </li>
      </ul>
    </div>
  );
};

export default SmartPoolInfo;
