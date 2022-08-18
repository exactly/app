import { useContext, useMemo, useState } from 'react';
import { Contract, ethers } from 'ethers';
import dayjs from 'dayjs';
import Skeleton from 'react-loading-skeleton';

import LangContext from 'contexts/LangContext';
import AccountDataContext from 'contexts/AccountDataContext';

import { LangKeys } from 'types/Lang';
import { Maturity } from 'types/Maturity';

import styles from './style.module.scss';

import keys from './translations.json';

import numbers from 'config/numbers.json';

import parseSymbol from 'utils/parseSymbol';
import formatNumber from 'utils/formatNumber';

interface Props {
  maturity: Maturity;
  symbol: string;
  fixedLender: Contract | undefined;
}

function MaturityInfo({ maturity, symbol, fixedLender }: Props) {
  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [supply, setSupply] = useState<number | undefined>(undefined);
  const [demand, setDemand] = useState<number | undefined>(undefined);
  const [utilization, setUtilization] = useState<number | undefined>(undefined);

  const daysRemaining = dayjs.unix(parseInt(maturity.value)).diff(dayjs(), 'days');

  const color =
    daysRemaining < numbers.daysToError
      ? styles.error
      : daysRemaining < numbers.daysToWarning
      ? styles.warning
      : styles.status;

  const rtf = new Intl.RelativeTimeFormat('en', {
    localeMatcher: 'best fit',
    numeric: 'always',
    style: 'long'
  });

  useMemo(() => {
    getMaturityPoolData();
  }, [fixedLender, maturity, symbol]);

  function getMaturityPoolData() {
    if (!accountData) return;

    try {
      const pool = accountData[symbol.toUpperCase()].fixedPools.find((pool) => {
        return pool.maturity.toString() == maturity.value;
      });

      const decimals = accountData[symbol.toUpperCase()].decimals;

      const poolUtilization = ethers.utils.formatUnits(pool?.utilization!, 18);
      const borrowed = ethers.utils.formatUnits(pool?.borrowed!, decimals);
      const supplied = ethers.utils.formatUnits(pool?.supplied!, decimals);

      const exchangeRate = parseFloat(
        ethers.utils.formatEther(accountData[symbol.toUpperCase()].oraclePrice)
      );

      const newPoolData = {
        borrowed: parseFloat(borrowed),
        supplied: parseFloat(supplied)
      };

      setSupply(newPoolData.supplied * exchangeRate);
      setDemand(newPoolData.borrowed * exchangeRate);
      setUtilization(parseFloat(poolUtilization));
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div className={styles.maturityContainer}>
      <div className={styles.titleContainer}>{maturity.label}</div>
      <ul className={styles.table}>
        <li className={styles.header}>
          <div className={styles.assetInfo}>
            <img
              className={styles.assetImage}
              src={`/img/assets/${symbol.toLowerCase()}.png`}
              alt={symbol}
            />
            <p className={styles.asset}>{parseSymbol(symbol)}</p>
          </div>
          <p className={color}>
            <img src="/img/icons/clock.svg" alt="clock" />
            {rtf.format(daysRemaining, 'day')}
          </p>
        </li>
        <li className={styles.row}>
          <span className={styles.title}>{translations[lang].totalBorrowed}</span>{' '}
          <p className={styles.value}>
            {demand && demand > 0 ? (
              `$${formatNumber(demand, symbol, true)}`
            ) : demand == 0 ? (
              '0.00'
            ) : (
              <Skeleton />
            )}
          </p>
        </li>
        <li className={styles.row}>
          <span className={styles.title}>{translations[lang].totalDeposited}</span>{' '}
          <p className={styles.value}>
            {supply && supply > 0 ? (
              `$${formatNumber(supply, symbol, true)}`
            ) : supply == 0 ? (
              '0.00'
            ) : (
              <Skeleton />
            )}
          </p>
        </li>
        <li className={styles.row}>
          <span className={styles.title}>{translations[lang].utilizationRate}</span>{' '}
          <p className={styles.value}>
            {utilization != undefined ? `${utilization.toFixed(2)}%` : <Skeleton />}
          </p>
        </li>
      </ul>
    </div>
  );
}

export default MaturityInfo;
