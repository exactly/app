import { useContext } from 'react';

import Item from './Item';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';
import { Option } from 'react-dropdown';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  type: Option;
};

function MaturityPoolUserStatusByAsset({ type }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <div className={styles.container}>
      <div className={styles.market}>
        <div className={styles.column}>
          <div className={styles.tableRow}>
            <span className={styles.symbol}>{translations[lang].asset}</span>
            <span className={styles.title}>
              {translations[lang].marketSize}
            </span>
            <span className={styles.title}>{translations[lang].fixedRate}</span>
            <span className={styles.title}>
              {translations[lang].maturityDate}
            </span>
            <span className={styles.title}>{translations[lang].progress}</span>
            <span className={styles.title} />
          </div>

          <Item type={type} />
          <Item type={type} />
          <Item type={type} />
        </div>
      </div>
    </div>
  );
}

export default MaturityPoolUserStatusByAsset;
