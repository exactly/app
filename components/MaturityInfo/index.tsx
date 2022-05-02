import { useContext } from 'react';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';
import { Maturity } from 'types/Maturity';

import styles from './style.module.scss';

import keys from './translations.json';

import numbers from 'config/numbers.json';
import parseSymbol from 'utils/parseSymbol';

interface Props {
  maturity: Maturity;
  symbol: string;
}

function MaturityInfo({ maturity, symbol }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const days = (new Date(maturity.label).getTime() - new Date().getTime()) / (1000 * 3600 * 24);

  const color =
    days < numbers.daysToError
      ? styles.error
      : days < numbers.daysToWarning
      ? styles.warning
      : styles.status;

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
            {Math.floor(days)}{' '}
            {Math.floor(days) != 1 ? translations[lang].days : translations[lang].day}
          </p>
        </li>
        <li className={styles.row}>
          <span className={styles.title}>{translations[lang].totalBorrowed}</span>{' '}
          <p className={styles.value}>1.553.612.280,17</p>
        </li>
        <li className={styles.row}>
          <span className={styles.title}> {translations[lang].liquidity}</span>{' '}
          <p className={styles.value}>384.186.120,43</p>
        </li>
        <li className={styles.row}>
          <span className={styles.title}>{translations[lang].utilizationRate}</span>{' '}
          <p className={styles.value}>80%</p>
        </li>
        <li className={styles.row}>
          <span className={styles.title}>{translations[lang].suppliers}</span>{' '}
          <p className={styles.value}>68693</p>
        </li>
        <li className={styles.row}>
          <span className={styles.title}>{translations[lang].borrowers}</span>{' '}
          <p className={styles.value}>1292</p>
        </li>
      </ul>
    </div>
  );
}

export default MaturityInfo;
