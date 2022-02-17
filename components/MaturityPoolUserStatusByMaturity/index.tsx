import { useContext } from 'react';

import Item from './Item';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';
import { Option } from 'react-dropdown';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  type: Option;
  deposits: any,
  borrows: any
};

function MaturityPoolUserStatusByMaturity({ type, deposits, borrows }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <>
      <div className={styles.container}>
        <p className={styles.date}>01-Mar-22</p>
        <div className={styles.market}>
          <div className={styles.column}>
            <div className={styles.tableRow}>
              <span className={styles.symbol}>{translations[lang].asset}</span>
              <span className={styles.title}>
                {translations[lang].marketSize}
              </span>
              <span className={styles.title}>
                {translations[lang].fixedRate}
              </span>
              <span className={styles.title}>
                {translations[lang].progress}
              </span>
              <span className={styles.title} />
            </div>

            <Item type={type} />
            <Item type={type} />
            <Item type={type} />
          </div>
        </div>
      </div>
      <div className={styles.container}>
        <p className={styles.date}>15-Mar-22</p>
        <div className={styles.market}>
          <div className={styles.column}>
            <div className={styles.tableRow}>
              <span className={styles.symbol}>{translations[lang].asset}</span>
              <span className={styles.title}>
                {translations[lang].marketSize}
              </span>
              <span className={styles.title}>
                {translations[lang].fixedRate}
              </span>
              <span className={styles.title}>
                {translations[lang].progress}
              </span>
              <span className={styles.title} />
            </div>

            <Item type={type} />
            <Item type={type} />
            <Item type={type} />
          </div>
        </div>
      </div>
    </>
  );
}

export default MaturityPoolUserStatusByMaturity;
