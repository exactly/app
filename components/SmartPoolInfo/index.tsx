import { useContext } from 'react';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

import Button from 'components/common/Button';
import Tooltip from 'components/Tooltip';

function SmartPoolInfo() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <div className={styles.maturityContainer}>
      <div className={styles.titleContainer}>
        <p className={styles.title}>{translations[lang].smartPool}</p>
        <Tooltip />
      </div>
      <ul className={styles.table}>
        <li className={styles.header}>
          <div className={styles.assetInfo}>
            <img
              className={styles.assetImage}
              src="/img/assets/dai.png"
              alt="dai"
            />
            <p className={styles.asset}>DAI</p>
          </div>
          <div className={styles.buttonContainer}>
            <Button text={translations[lang].deposit} className="tertiary" />
          </div>
        </li>
        <li className={styles.row}>
          <span className={styles.title}>
            {translations[lang].totalBorrowed}
          </span>{' '}
          <p className={styles.value}>1.553.612.280,17</p>
        </li>
        <li className={styles.row}>
          <span className={styles.title}> {translations[lang].liquidity}</span>{' '}
          <p className={styles.value}>384.186.120,43</p>
        </li>
        <li className={styles.row}>
          <span className={styles.title}>
            {translations[lang].utilizationRate}
          </span>{' '}
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

export default SmartPoolInfo;
